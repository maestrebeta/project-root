from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from app.models.task_models import Task
from app.schemas.task_schema import TaskCreate, TaskUpdate, TaskOut, TaskStats

def create_task(db: Session, task: TaskCreate, assigned_by_user_id: int) -> Task:
    """Crear una nueva tarea"""
    db_task = Task(
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        assigned_to=task.assigned_to,
        assigned_by=assigned_by_user_id,
        organization_id=task.organization_id,
        due_date=task.due_date,
        estimated_hours=task.estimated_hours,
        actual_hours=task.actual_hours,
        tags=task.tags,
        notes=task.notes
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def get_task(db: Session, task_id: int) -> Optional[Task]:
    """Obtener una tarea por ID"""
    return db.query(Task).filter(Task.task_id == task_id).first()

def get_tasks_by_organization(
    db: Session, 
    organization_id: int, 
    skip: int = 0, 
    limit: int = 100,
    user_id: Optional[int] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None
) -> List[Task]:
    """Obtener tareas de una organización con filtros opcionales"""
    query = db.query(Task).filter(Task.organization_id == organization_id)
    
    # Filtrar por usuario asignado si se especifica
    if user_id:
        query = query.filter(Task.assigned_to == user_id)
    
    # Filtrar por estado
    if status:
        query = query.filter(Task.status == status)
    
    # Filtrar por prioridad
    if priority:
        query = query.filter(Task.priority == priority)
    
    return query.offset(skip).limit(limit).all()

def update_task(db: Session, task_id: int, task_update: TaskUpdate) -> Optional[Task]:
    """Actualizar una tarea"""
    db_task = get_task(db, task_id)
    if not db_task:
        return None
    
    update_data = task_update.dict(exclude_unset=True)
    
    # Si se está marcando como completada, establecer completed_at
    if update_data.get('status') == 'completed' and db_task.status != 'completed':
        update_data['completed_at'] = datetime.utcnow()
    elif update_data.get('status') != 'completed':
        update_data['completed_at'] = None
    
    for field, value in update_data.items():
        setattr(db_task, field, value)
    
    db_task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int) -> bool:
    """Eliminar una tarea"""
    db_task = get_task(db, task_id)
    if not db_task:
        return False
    
    db.delete(db_task)
    db.commit()
    return True

def get_task_stats(db: Session, organization_id: int, user_id: Optional[int] = None) -> TaskStats:
    """Obtener estadísticas de tareas"""
    query = db.query(Task).filter(Task.organization_id == organization_id)
    
    if user_id:
        query = query.filter(Task.assigned_to == user_id)
    
    tasks = query.all()
    
    # Calcular estadísticas
    total_tasks = len(tasks)
    pending_tasks = len([t for t in tasks if t.status == 'pending'])
    blocked_tasks = len([t for t in tasks if t.status == 'blocked'])
    
    # Calcular tareas vencidas y próximas a vencer
    today = datetime.utcnow()
    overdue_tasks = len([t for t in tasks if t.due_date and t.due_date < today and t.status != 'completed'])
    due_soon_tasks = len([t for t in tasks if t.due_date and t.due_date > today and t.due_date <= today + timedelta(days=7) and t.status != 'completed'])
    
    return TaskStats(
        total_tasks=total_tasks,
        pending_tasks=pending_tasks,
        blocked_tasks=blocked_tasks,
        overdue_tasks=overdue_tasks,
        due_soon_tasks=due_soon_tasks
    )

def search_tasks(
    db: Session, 
    organization_id: int, 
    search_term: str,
    user_id: Optional[int] = None
) -> List[Task]:
    """Buscar tareas por término de búsqueda"""
    query = db.query(Task).filter(Task.organization_id == organization_id)
    
    if user_id:
        query = query.filter(Task.assigned_to == user_id)
    
    # Buscar en título, descripción y etiquetas
    search_filter = or_(
        Task.title.ilike(f'%{search_term}%'),
        Task.description.ilike(f'%{search_term}%'),
        Task.tags.contains([search_term])
    )
    
    return query.filter(search_filter).all()

def get_tasks_with_details(db: Session, organization_id: int, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """Obtener tareas con información detallada de usuarios"""
    from app.models.user_models import User
    
    query = db.query(
        Task,
        User.full_name.label('assigned_to_name'),
        User.full_name.label('assigned_by_name')
    ).outerjoin(
        User, Task.assigned_to == User.user_id
    ).outerjoin(
        User, Task.assigned_by == User.user_id
    ).filter(Task.organization_id == organization_id)
    
    if user_id:
        query = query.filter(Task.assigned_to == user_id)
    
    results = query.all()
    
    tasks_with_details = []
    for result in results:
        task_dict = {
            'task_id': result.Task.task_id,
            'title': result.Task.title,
            'description': result.Task.description,
            'status': result.Task.status,
            'priority': result.Task.priority,
            'assigned_to': result.Task.assigned_to,
            'assigned_by': result.Task.assigned_by,
            'organization_id': result.Task.organization_id,
            'due_date': result.Task.due_date,
            'estimated_hours': result.Task.estimated_hours,
            'actual_hours': result.Task.actual_hours,
            'tags': result.Task.tags,
            'notes': result.Task.notes,
            'created_at': result.Task.created_at,
            'updated_at': result.Task.updated_at,
            'completed_at': result.Task.completed_at,
            'assigned_to_name': result.assigned_to_name,
            'assigned_by_name': result.assigned_by_name,
            'progress_percentage': calculate_progress_percentage(result.Task)
        }
        tasks_with_details.append(task_dict)
    
    return tasks_with_details

def calculate_progress_percentage(task: Task) -> int:
    """Calcular el porcentaje de progreso de una tarea"""
    if task.status == 'completed':
        return 100
    elif task.status == 'blocked':
        return 0
    elif task.status == 'in_progress':
        # Si hay horas estimadas y reales, calcular progreso basado en tiempo
        if task.estimated_hours and task.actual_hours:
            progress = min(int((task.actual_hours / task.estimated_hours) * 100), 90)
            return progress
        else:
            return 50  # Progreso medio para tareas en progreso sin horas
    elif task.status == 'pending':
        return 0
    else:
        return 0 