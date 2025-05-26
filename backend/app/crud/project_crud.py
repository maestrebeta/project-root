from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from app.models.project_models import Project
from app.schemas.project_schema import ProjectCreate, ProjectUpdate
from app.models.organization_models import Organization
from datetime import datetime


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
        'active', 'paused', 'completed', 'archived'
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
        'nuevo': 'active',
        'en_progreso': 'active', 
        'completado': 'completed',
        'pausado': 'paused',
        'cancelado': 'archived'
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
        estimated_hours=project.estimated_hours,
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
        # Manejar errores de integridad (por ejemplo, nombre de proyecto duplicado)
        print(f"Error de integridad al crear proyecto: {str(e)}")
        raise ValueError("No se pudo crear el proyecto. Verifique los datos.")


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
                'active', 'paused', 'completed', 'archived'
            ]
            
            # Mapeo de estados (igual que en el schema)
            status_mapping = {
                'nuevo': 'active',
                'en_progreso': 'active', 
                'completado': 'completed',
                'pausado': 'paused',
                'cancelado': 'archived',
                'new': 'active',
                'in_progress': 'active',
                'completed': 'completed',
                'paused': 'paused',
                'canceled': 'archived'
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
        for key, value in updates.dict(exclude_unset=True).items():
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
