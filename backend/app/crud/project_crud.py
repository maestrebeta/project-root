from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.project_models import Project
from app.schemas.project_schema import ProjectCreate, ProjectUpdate
from app.models.organization_models import Organization
from datetime import datetime, date, timedelta


def calculate_estimated_hours(start_date, end_date, project_type='development', organization=None):
    """
    Calcular horas estimadas basándose en las fechas de inicio y fin del proyecto,
    usando la configuración de horas de trabajo de la organización.
    
    Args:
        start_date: Fecha de inicio del proyecto
        end_date: Fecha de fin del proyecto
        project_type: Tipo de proyecto para ajustar el cálculo
        organization: Objeto organización con configuración de horas de trabajo
    
    Returns:
        int: Número de horas estimadas o None si no se pueden calcular
    """
    if not start_date or not end_date:
        return None
    
    # Convertir a objetos date si son strings
    if isinstance(start_date, str):
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    elif isinstance(start_date, datetime):
        start_date = start_date.date()
    
    if isinstance(end_date, str):
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    elif isinstance(end_date, datetime):
        end_date = end_date.date()
    
    # Validar que la fecha de fin sea posterior a la de inicio
    if end_date <= start_date:
        return None
    
    # Obtener configuración de horas de trabajo de la organización
    work_config = organization.work_hours_config if organization else None
    if not work_config:
        # Configuración por defecto si no hay organización
        work_config = {
            "effective_daily_hours": 7,
            "working_days": [1, 2, 3, 4, 5]  # Lunes a Viernes
        }
    
    working_days_of_week = work_config.get('working_days', [1, 2, 3, 4, 5])
    effective_daily_hours = work_config.get('effective_daily_hours', 7)
    
    # Calcular días laborables según la configuración de la organización
    current_date = start_date
    working_days = 0
    
    while current_date < end_date:
        # weekday() devuelve 0=Lunes, 6=Domingo, pero nuestra config usa 1=Lunes, 7=Domingo
        weekday = current_date.weekday() + 1
        if weekday in working_days_of_week:
            working_days += 1
        current_date += timedelta(days=1)
    
    # Factor de dedicación según el tipo de proyecto
    project_dedication_factor = {
        'development': 0.85,   # 85% del tiempo efectivo para desarrollo
        'support': 0.60,       # 60% del tiempo efectivo para soporte
        'meeting': 0.30,       # 30% del tiempo efectivo para reuniones
        'training': 0.70,      # 70% del tiempo efectivo para capacitación
        'other': 0.50          # 50% del tiempo efectivo para otros
    }
    
    dedication_factor = project_dedication_factor.get(project_type, 0.50)
    project_hours_per_day = effective_daily_hours * dedication_factor
    estimated_hours = working_days * project_hours_per_day
    
    return int(round(estimated_hours))


def get_project(db: Session, project_id: int):
    return db.query(Project).filter(Project.project_id == project_id).first()


def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Project).offset(skip).limit(limit).all()


def get_projects_by_organization(db: Session, organization_id: int, skip: int = 0, limit: int = 100):
    """
    Obtener proyectos de una organización específica
    """
    try:
        # Verificar si la organización existe
        organization = db.query(Organization).filter(Organization.organization_id == organization_id).first()
        if not organization:
            print(f"Organización con ID {organization_id} no encontrada")
            return []

        # Buscar proyectos de la organización
        query = (
            db.query(Project)
            .filter(Project.organization_id == organization_id)
            .offset(skip)
            .limit(limit)
        )
        
        proyectos = query.all()
        
        print(f"Número de proyectos encontrados: {len(proyectos)}")
        for proyecto in proyectos:
            print(f"Proyecto: {proyecto.name}, ID: {proyecto.project_id}, Org ID: {proyecto.organization_id}")
        
        return proyectos
    except Exception as e:
        print(f"Error al buscar proyectos: {str(e)}")
        return []


def create_project(db: Session, project: ProjectCreate):
    """
    Crear un proyecto, asegurando que tenga una organización
    """
    # Tipos de proyecto válidos según la definición SQL
    valid_project_types = [
        'development', 'support', 'meeting', 'training', 'other'
    ]
    
    # Estados válidos según la definición SQL
    valid_statuses = [
        'registered_initiative', 'in_quotation', 'proposal_approved', 'in_planning', 
        'in_progress', 'at_risk', 'suspended', 'completed', 'canceled', 'post_delivery_support'
    ]

    # Mapeo de tipos de proyecto (si es necesario)
    project_type_mapping = {
        'desarrollo': 'development',
        'soporte': 'support',
        'reunion': 'meeting',
        'capacitacion': 'training',
        'otro': 'other'
    }

    # Mapeo de estados (si es necesario)
    status_mapping = {
        'nuevo': 'registered_initiative',
        'en_progreso': 'in_progress', 
        'completado': 'completed',
        'pausado': 'suspended',
        'cancelado': 'canceled',
        'active': 'in_progress',
        'paused': 'suspended',
        'archived': 'canceled'
    }

    # Normalizar tipo de proyecto
    normalized_project_type = project_type_mapping.get(
        project.project_type.lower(), 
        project.project_type.lower()
    )

    # Validar tipo de proyecto
    if normalized_project_type not in valid_project_types:
        raise ValueError(f"Tipo de proyecto inválido. Debe ser uno de: {valid_project_types}")

    # Normalizar estado
    normalized_status = status_mapping.get(
        project.status.lower(), 
        project.status.lower()
    )

    # Validar estado
    if normalized_status not in valid_statuses:
        raise ValueError(f"Estado de proyecto inválido. Debe ser uno de: {valid_statuses}")

    # Obtener la organización del usuario actual o la especificada
    organization = db.query(Organization).filter(Organization.organization_id == project.organization_id).first()
    if not organization:
        raise ValueError("Organización no encontrada")
    
    # Verificar si el código del proyecto ya existe (si se proporciona)
    if project.code:
        existing_project = db.query(Project).filter(Project.code == project.code).first()
        if existing_project:
            raise ValueError(f"Ya existe un proyecto con el código '{project.code}'")
    
    # Calcular horas estimadas automáticamente si se proporcionan fechas
    calculated_hours = None
    if project.start_date and project.end_date:
        calculated_hours = calculate_estimated_hours(
            project.start_date, 
            project.end_date, 
            normalized_project_type,
            organization
        )
    
    # Usar horas calculadas si no se proporcionaron horas estimadas manualmente
    final_estimated_hours = project.estimated_hours if project.estimated_hours is not None else calculated_hours
    
    # Crear el proyecto con tipos y estados normalizados
    db_project = Project(
        client_id=project.client_id,
        name=project.name,
        code=project.code,
        description=project.description,
        project_type=normalized_project_type,
        status=normalized_status,
        start_date=project.start_date,
        end_date=project.end_date,
        manager_id=project.manager_id,
        estimated_hours=final_estimated_hours,
        priority=project.priority or 'medium',
        tags=project.tags,
        organization_id=organization.organization_id
    )
    
    try:
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        return db_project
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        print(f"Error de integridad al crear proyecto: {error_msg}")
        
        # Manejar errores específicos
        if 'unique_project_client' in error_msg:
            raise ValueError(f"Ya existe un proyecto con el nombre '{project.name}' para este cliente")
        elif 'projects_project_type_check' in error_msg:
            raise ValueError(f"Tipo de proyecto inválido: {project.project_type}")
        elif 'projects_status_check' in error_msg:
            raise ValueError(f"Estado de proyecto inválido: {project.status}")
        elif 'code' in error_msg and 'unique' in error_msg.lower():
            raise ValueError(f"Ya existe un proyecto con el código '{project.code}'")
        else:
            raise ValueError("No se pudo crear el proyecto. Verifique que los datos sean únicos y válidos.")


def update_project(db: Session, project_id: int, updates: ProjectUpdate):
    """
    Actualizar un proyecto, validando tipos y estados
    """
    try:
        db_project = get_project(db, project_id)
        if not db_project:
            return None
        
        # Validar tipos de proyecto si se proporcionan
        if updates.project_type:
            valid_project_types = [
                'development', 'support', 'meeting', 'training', 'other'
            ]
            
            # Mapeo de tipos de proyecto
            project_type_mapping = {
                'desarrollo': 'development',
                'soporte': 'support',
                'reunion': 'meeting',
                'capacitacion': 'training',
                'otro': 'other',
                'consultoria': 'other'  # Mapear consultoria a other
            }
            
            # Normalizar tipo de proyecto
            normalized_project_type = project_type_mapping.get(
                updates.project_type.lower(), 
                updates.project_type.lower()
            )
            
            if normalized_project_type not in valid_project_types:
                raise ValueError(f"Tipo de proyecto inválido. Debe ser uno de: {valid_project_types}")
            
            # Actualizar con el tipo normalizado
            updates.project_type = normalized_project_type
        
        if updates.status:
            valid_statuses = [
                'registered_initiative', 'in_quotation', 'proposal_approved', 'in_planning', 
                'in_progress', 'at_risk', 'suspended', 'completed', 'canceled', 'post_delivery_support'
            ]
            
            # Mapeo de estados (igual que en el schema)
            status_mapping = {
                'nuevo': 'registered_initiative',
                'en_progreso': 'in_progress', 
                'completado': 'completed',
                'pausado': 'suspended',
                'cancelado': 'canceled',
                'active': 'in_progress',
                'paused': 'suspended',
                'archived': 'canceled'
            }
            
            # Normalizar estado
            normalized_status = status_mapping.get(
                updates.status.lower(), 
                updates.status.lower()
            )
            
            if normalized_status not in valid_statuses:
                raise ValueError(f"Estado de proyecto inválido. Debe ser uno de: {valid_statuses}")
            
            # Actualizar con el estado normalizado
            updates.status = normalized_status
        
        # Actualizar campos
        update_data = updates.dict(exclude_unset=True)
        
        # Calcular horas estimadas automáticamente si se actualizan las fechas
        # y no se proporcionaron horas estimadas manualmente
        if ('start_date' in update_data or 'end_date' in update_data) and 'estimated_hours' not in update_data:
            # Obtener fechas actualizadas
            new_start_date = update_data.get('start_date', db_project.start_date)
            new_end_date = update_data.get('end_date', db_project.end_date)
            new_project_type = update_data.get('project_type', db_project.project_type)
            
            if new_start_date and new_end_date:
                # Obtener la organización del proyecto
                organization = db.query(Organization).filter(
                    Organization.organization_id == db_project.organization_id
                ).first()
                
                calculated_hours = calculate_estimated_hours(
                    new_start_date,
                    new_end_date,
                    new_project_type,
                    organization
                )
                if calculated_hours is not None:
                    update_data['estimated_hours'] = calculated_hours
        
        # Manejar estimated_hours específicamente - debe permitir None para limpiar el valor
        if hasattr(updates, 'estimated_hours') and 'estimated_hours' in updates.__fields_set__:
            update_data['estimated_hours'] = updates.estimated_hours
        
        for key, value in update_data.items():
            setattr(db_project, key, value)
        
        db.commit()
        db.refresh(db_project)
        return db_project
    except IntegrityError as e:
        db.rollback()
        print(f"Error de integridad al actualizar proyecto: {str(e)}")
        raise ValueError("No se pudo actualizar el proyecto. Verifique los datos.")


def delete_project(db: Session, project_id: int):
    """
    Eliminar un proyecto
    """
    try:
        db_project = get_project(db, project_id)
        if not db_project:
            return None
        
        db.delete(db_project)
        db.commit()
        return db_project
    except IntegrityError as e:
        db.rollback()
        print(f"Error de integridad al eliminar proyecto: {str(e)}")
        raise ValueError("No se pudo eliminar el proyecto. Verifique las dependencias.")
