from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, and_
from app.models.epic_models import Epic, UserStory
from app.models.project_models import Project
from app.schemas.epic_schema import EpicCreate, EpicUpdate, UserStoryCreate, UserStoryUpdate
from app.crud import notification_crud
from decimal import Decimal
from datetime import date, timedelta

# Epic CRUD Operations
def get_epic(db: Session, epic_id: int):
    """Obtener una épica por ID con estadísticas calculadas"""
    epic = db.query(Epic).filter(Epic.epic_id == epic_id).first()
    if epic:
        # Calcular estadísticas
        epic = calculate_epic_stats(db, epic)
    return epic

def get_epics_by_project(db: Session, project_id: int, skip: int = 0, limit: int = 100):
    """Obtener épicas de un proyecto con estadísticas"""
    epics = (
        db.query(Epic)
        .filter(Epic.project_id == project_id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    # Calcular estadísticas para cada épica
    for epic in epics:
        epic = calculate_epic_stats(db, epic)
    
    return epics

def create_epic(db: Session, epic: EpicCreate):
    """Crear una nueva épica"""
    try:
        # Verificar que el proyecto existe
        project = db.query(Project).filter(Project.project_id == epic.project_id).first()
        if not project:
            raise ValueError("Proyecto no encontrado")
        
        db_epic = Epic(**epic.dict())
        db.add(db_epic)
        db.commit()
        db.refresh(db_epic)
        
        # Calcular estadísticas iniciales
        db_epic = calculate_epic_stats(db, db_epic)
        
        # Actualizar el estado del proyecto si es necesario
        update_project_status_from_epics(db, db_epic.project_id)
        
        return db_epic
    except IntegrityError as e:
        db.rollback()
        raise ValueError("Error al crear la épica")

def update_epic(db: Session, epic_id: int, epic_update: EpicUpdate):
    """Actualizar una épica"""
    try:
        db_epic = get_epic(db, epic_id)
        if not db_epic:
            return None
        
        # Guardar el estado anterior para comparar
        old_status = db_epic.status
        
        update_data = epic_update.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_epic, key, value)
        
        db.commit()
        db.refresh(db_epic)
        
        # Recalcular estadísticas
        db_epic = calculate_epic_stats(db, db_epic)
        
        # Si el estado de la épica cambió, actualizar el estado del proyecto
        if 'status' in update_data and old_status != db_epic.status:
            update_project_status_from_epics(db, db_epic.project_id)
        
        return db_epic
    except IntegrityError as e:
        db.rollback()
        raise ValueError("Error al actualizar la épica")

def delete_epic(db: Session, epic_id: int):
    """Eliminar una épica y todas sus historias de usuario"""
    try:
        db_epic = get_epic(db, epic_id)
        if not db_epic:
            return None
        
        project_id = db_epic.project_id
        
        db.delete(db_epic)
        db.commit()
        
        # Actualizar el estado del proyecto después de eliminar la épica
        update_project_status_from_epics(db, project_id)
        
        return db_epic
    except IntegrityError as e:
        db.rollback()
        raise ValueError("Error al eliminar la épica")

# User Story CRUD Operations
def get_user_story(db: Session, story_id: int):
    """Obtener una historia de usuario por ID con estadísticas"""
    story = db.query(UserStory).filter(UserStory.story_id == story_id).first()
    if story:
        story = calculate_story_stats(db, story)
    return story

def get_user_stories_by_epic(db: Session, epic_id: int, skip: int = 0, limit: int = 100):
    """Obtener historias de usuario de una épica"""
    stories = (
        db.query(UserStory)
        .filter(UserStory.epic_id == epic_id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    for story in stories:
        story = calculate_story_stats(db, story)
    
    return stories

def get_user_stories_by_project(db: Session, project_id: int, skip: int = 0, limit: int = 100):
    """Obtener todas las historias de usuario de un proyecto"""
    stories = (
        db.query(UserStory)
        .filter(UserStory.project_id == project_id)
        .offset(skip)
        .limit(limit)
        .all()
    )
    
    for story in stories:
        story = calculate_story_stats(db, story)
    
    return stories

def create_user_story(db: Session, story: UserStoryCreate):
    """Crear una nueva historia de usuario"""
    try:
        # Verificar que la épica existe (solo si se proporciona epic_id)
        if story.epic_id:
            epic = db.query(Epic).filter(Epic.epic_id == story.epic_id).first()
            if not epic:
                raise ValueError("Épica no encontrada")
        
        # Verificar que el proyecto existe
        project = db.query(Project).filter(Project.project_id == story.project_id).first()
        if not project:
            raise ValueError("Proyecto no encontrado")
        
        # Obtener el usuario que está haciendo la asignación antes de eliminar el campo
        assigned_by_user_id = getattr(story, 'assigned_by_user_id', None)
        
        # Crear la historia sin assigned_by_user_id
        story_data = story.dict()
        if 'assigned_by_user_id' in story_data:
            del story_data['assigned_by_user_id']
        
        db_story = UserStory(**story_data)
        db.add(db_story)
        db.commit()
        db.refresh(db_story)
        
        # Crear notificación si se asignó a un usuario
        if db_story.assigned_user_id:
            try:
                from app.crud.notification_crud import create_user_story_assignment_notification
                from app.models.user_models import User
                
                # Obtener información del usuario asignado
                assigned_user = db.query(User).filter(User.user_id == db_story.assigned_user_id).first()
                if assigned_user:
                    # Usar el usuario que hizo la asignación o el usuario actual como fallback
                    assigned_by_user_id = assigned_by_user_id or 1  # Fallback
                    
                    create_user_story_assignment_notification(
                        db=db,
                        user_story_id=db_story.story_id,
                        assigned_user_id=db_story.assigned_user_id,
                        assigned_by_user_id=assigned_by_user_id,
                        organization_id=assigned_user.organization_id,
                        user_story_title=db_story.title
                    )
                    print(f"✅ Notificación creada para asignación de historia nueva: {db_story.title}")
            except Exception as e:
                print(f"⚠️ Error al crear notificación de asignación: {e}")
                # No fallar la operación principal por un error en la notificación
        
        # Actualizar estadísticas de la épica padre (solo si tiene épica)
        if db_story.epic_id:
            update_epic_stats(db, db_story.epic_id)
        
        # Calcular estadísticas de la historia
        db_story = calculate_story_stats(db, db_story)
        
        return db_story
    except IntegrityError as e:
        db.rollback()
        raise ValueError("Error al crear la historia de usuario")

def update_user_story(db: Session, story_id: int, story_update: UserStoryUpdate):
    """Actualizar una historia de usuario"""
    try:
        db_story = get_user_story(db, story_id)
        if not db_story:
            return None
        
        old_epic_id = db_story.epic_id
        old_assigned_user_id = db_story.assigned_user_id
        update_data = story_update.dict(exclude_unset=True)
        
        # Obtener el usuario que está haciendo la asignación antes de eliminar el campo
        assigned_by_user_id = update_data.get('assigned_by_user_id')
        
        # Eliminar assigned_by_user_id si existe (no es un campo del modelo)
        if 'assigned_by_user_id' in update_data:
            del update_data['assigned_by_user_id']
        
        for key, value in update_data.items():
            setattr(db_story, key, value)
        
        db.commit()
        db.refresh(db_story)
        
        # Verificar si se asignó a un nuevo usuario
        new_assigned_user_id = db_story.assigned_user_id
        if (new_assigned_user_id and 
            new_assigned_user_id != old_assigned_user_id):
            try:
                from app.crud.notification_crud import create_user_story_assignment_notification
                from app.models.user_models import User
                assigned_user = db.query(User).filter(User.user_id == new_assigned_user_id).first()
                if assigned_user:
                    assigned_by_user_id = assigned_by_user_id or 1  # Fallback
                    create_user_story_assignment_notification(
                        db=db,
                        user_story_id=story_id,
                        assigned_user_id=new_assigned_user_id,
                        assigned_by_user_id=assigned_by_user_id,
                        organization_id=assigned_user.organization_id,
                        user_story_title=db_story.title
                    )
            except Exception as e:
                pass
        # Actualizar estadísticas de las épicas (tanto la anterior como la nueva si cambió)
        if old_epic_id:
            update_epic_stats(db, old_epic_id)
        if db_story.epic_id and db_story.epic_id != old_epic_id:
            update_epic_stats(db, db_story.epic_id)
        # Calcular estadísticas de la historia
        db_story = calculate_story_stats(db, db_story)
        return db_story
    except IntegrityError as e:
        db.rollback()
        raise ValueError("Error al actualizar la historia de usuario")

def delete_user_story(db: Session, story_id: int):
    """Eliminar una historia de usuario"""
    try:
        db_story = get_user_story(db, story_id)
        if not db_story:
            return None
        
        epic_id = db_story.epic_id
        db.delete(db_story)
        db.commit()
        
        # Actualizar estadísticas de la épica padre (solo si tenía épica)
        if epic_id:
            update_epic_stats(db, epic_id)
        
        return db_story
    except IntegrityError as e:
        db.rollback()
        raise ValueError("Error al eliminar la historia de usuario")

# Utility Functions
def calculate_story_stats(db: Session, story: UserStory):
    """Calcular estadísticas de una historia de usuario"""
    # Calcular horas totales estimadas (solo estimated_hours)
    total_estimated = story.estimated_hours or 0
    
    # Calcular progreso basado en el estado
    progress_map = {
        'backlog': 0,
        'todo': 10,
        'in_progress': 50,
        'in_review': 80,
        'testing': 90,
        'done': 100,
        'blocked': 0
    }
    
    progress = progress_map.get(story.status, 0)
    
    # Agregar campos calculados
    story.total_estimated_hours = total_estimated
    story.progress_percentage = Decimal(progress)
    
    return story

def calculate_epic_stats(db: Session, epic: Epic):
    """Calcular estadísticas de una épica basándose en sus historias"""
    # Obtener estadísticas de las historias de usuario
    story_stats = (
        db.query(
            func.count(UserStory.story_id).label('total_stories'),
            func.count(func.nullif(UserStory.status != 'done', True)).label('completed_stories'),
            func.coalesce(func.sum(UserStory.estimated_hours), 0).label('total_estimated_hours'),
            func.coalesce(func.sum(UserStory.actual_hours), 0).label('total_actual_hours')
        )
        .filter(UserStory.epic_id == epic.epic_id)
        .first()
    )
    
    total_stories = story_stats.total_stories or 0
    completed_stories = story_stats.completed_stories or 0
    total_estimated_hours = story_stats.total_estimated_hours or 0
    total_actual_hours = story_stats.total_actual_hours or 0
    
    # Calcular progreso
    progress = 0
    if total_stories > 0:
        progress = (completed_stories / total_stories) * 100
    
    # Actualizar campos calculados en la épica
    epic.estimated_hours = Decimal(total_estimated_hours)
    epic.actual_hours = Decimal(total_actual_hours)
    epic.progress_percentage = Decimal(progress)
    epic.total_stories = total_stories
    epic.completed_stories = completed_stories
    
    return epic

def update_epic_stats(db: Session, epic_id: int):
    """Actualizar las estadísticas de una épica en la base de datos"""
    epic = db.query(Epic).filter(Epic.epic_id == epic_id).first()
    if epic:
        epic = calculate_epic_stats(db, epic)
        
        # Actualizar en la base de datos
        db.query(Epic).filter(Epic.epic_id == epic_id).update({
            'estimated_hours': epic.estimated_hours,
            'actual_hours': epic.actual_hours,
            'progress_percentage': epic.progress_percentage
        })
        db.commit()
        
        # Actualizar el estado del proyecto padre
        update_project_status_from_epics(db, epic.project_id)

def update_project_estimated_hours(db: Session, project_id: int):
    """
    Actualizar las horas estimadas del proyecto basándose en la suma de 
    las horas estimadas de todas sus historias de usuario
    """
    # Calcular horas totales de todas las historias del proyecto
    total_hours = (
        db.query(
            func.coalesce(func.sum(UserStory.estimated_hours), 0)
        )
        .filter(UserStory.project_id == project_id)
        .scalar()
    )
    
    # Actualizar el proyecto
    db.query(Project).filter(Project.project_id == project_id).update({
        'estimated_hours': int(total_hours) if total_hours else None
    })
    db.commit()
    
    return total_hours

def get_project_planning_stats(db: Session, project_id: int):
    """Obtener estadísticas completas de planificación de un proyecto"""
    # Estadísticas del proyecto
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        return None
    
    # Estadísticas de épicas
    epics = get_epics_by_project(db, project_id)
    
    # Convertir épicas a diccionarios serializables
    epics_data = []
    for epic in epics:
        epic_dict = {
            'epic_id': epic.epic_id,
            'project_id': epic.project_id,
            'name': epic.name,
            'description': epic.description,
            'status': epic.status,
            'priority': epic.priority,
            'start_date': epic.start_date.isoformat() if epic.start_date else None,
            'end_date': epic.end_date.isoformat() if epic.end_date else None,
            'color': epic.color,
            'acceptance_criteria': epic.acceptance_criteria,
            'business_value': epic.business_value,
            'estimated_hours': float(epic.estimated_hours) if epic.estimated_hours else None,
            'actual_hours': float(epic.actual_hours) if epic.actual_hours else None,
            'progress_percentage': float(epic.progress_percentage) if epic.progress_percentage else None,
            'created_at': epic.created_at.isoformat() if epic.created_at else None,
            'updated_at': epic.updated_at.isoformat() if epic.updated_at else None,
            'total_stories': getattr(epic, 'total_stories', 0),
            'completed_stories': getattr(epic, 'completed_stories', 0)
        }
        epics_data.append(epic_dict)
    
    # Estadísticas generales
    total_stories = db.query(func.count(UserStory.story_id)).filter(
        UserStory.project_id == project_id
    ).scalar()
    
    completed_stories = db.query(func.count(UserStory.story_id)).filter(
        and_(UserStory.project_id == project_id, UserStory.status == 'done')
    ).scalar()
    
    total_estimated_hours = db.query(
        func.coalesce(func.sum(UserStory.estimated_hours), 0)
    ).filter(UserStory.project_id == project_id).scalar()
    
    total_actual_hours = db.query(
        func.coalesce(func.sum(UserStory.actual_hours), 0)
    ).filter(UserStory.project_id == project_id).scalar()
    
    overall_progress = 0
    if total_stories > 0:
        overall_progress = (completed_stories / total_stories) * 100
    
    return {
        'project_id': project_id,
        'project_name': project.name,
        'total_epics': len(epics),
        'total_stories': total_stories,
        'completed_stories': completed_stories,
        'total_estimated_hours': float(total_estimated_hours),
        'total_actual_hours': float(total_actual_hours),
        'overall_progress': float(overall_progress),
        'epics': epics_data
    }

def update_project_status_from_epics(db: Session, project_id: int):
    """
    Actualizar el estado del proyecto basándose en el estado de sus épicas.
    Si todas las épicas están en estado 'done', el proyecto cambia a 'completed'.
    Si alguna épica no está en 'done', el proyecto cambia a 'in_progress'.
    """
    from app.models.project_models import Project
    
    # Obtener todas las épicas del proyecto
    project_epics = db.query(Epic).filter(Epic.project_id == project_id).all()
    
    if not project_epics:
        return  # No hay épicas, no cambiar el estado del proyecto
    
    # Verificar si todas las épicas están completadas
    all_epics_completed = all(epic.status == 'done' for epic in project_epics)
    
    # Obtener el proyecto actual
    project = db.query(Project).filter(Project.project_id == project_id).first()
    if not project:
        return
    
    # Determinar el nuevo estado del proyecto
    new_status = project.status
    
    if all_epics_completed and project.status != 'completed':
        # Si todas las épicas están completadas, cambiar a 'completed'
        new_status = 'completed'
        print(f"🎉 Todas las épicas del proyecto {project.name} están completadas. Cambiando estado a 'completed'...")
    elif not all_epics_completed and project.status == 'completed':
        # Si no todas las épicas están completadas pero el proyecto está en 'completed', regresar a 'in_progress'
        new_status = 'in_progress'
        print(f"🔄 Algunas épicas del proyecto {project.name} ya no están completadas. Regresando estado a 'in_progress'...")
    
    # Si el estado cambió, actualizar el proyecto
    if new_status != project.status:
        project.status = new_status
        db.commit()
        print(f"✅ Proyecto '{project.name}' actualizado a estado '{new_status}'") 