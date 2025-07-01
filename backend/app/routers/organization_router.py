from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import logging
from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_organization
from app.models.user_models import User, ExternalUser
from app.models.organization_models import Organization
from app.schemas.organization_schema import (
    OrganizationCreate, 
    OrganizationUpdate, 
    OrganizationOut, 
    OrganizationWithDetails,
    OrganizationRatingCreate, OrganizationRatingUpdate, OrganizationRatingOut,
    OrganizationRatingStats
)
from app.crud import organization_crud, user_crud
from app.crud.organization_crud import get_organization
from datetime import datetime, timedelta

# Configurar logger
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/organizations",
    tags=["organizations"]
)

# Estados predeterminados del sistema
DEFAULT_TASK_STATES = {
    "states": [
        {
            "id": 1,
            "label": "Pendiente",
            "icon": "🔴",
            "color": "red"
        },
        {
            "id": 2,
            "label": "En Progreso",
            "icon": "🔵",
            "color": "blue"
        },
        {
            "id": 3,
            "label": "Completada",
            "icon": "🟢",
            "color": "green"
        }
    ],
    "default_state": 1,
    "final_states": [3]
}

# Función para obtener usuario externo actual
def get_current_external_user(token: str, db: Session):
    external_user = user_crud.verify_external_user_token(db, token)
    if not external_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    return external_user

@router.post("", response_model=OrganizationOut)
def create_organization(
    organization: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Solo super usuarios pueden crear organizaciones
    if current_user.role != 'super_user':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los super usuarios pueden crear organizaciones"
        )
    
    # Verificar si ya existe una organización con ese nombre
    existing_org = organization_crud.get_organization_by_name(db, organization.name)
    if existing_org:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una organización con este nombre"
        )
    
    # Crear la organización (esto también creará los usuarios por defecto)
    created_organization = organization_crud.create_organization(db, organization)
    
    # Preparar respuesta con información de usuarios creados
    response_data = {
        "organization_id": created_organization.organization_id,
        "name": created_organization.name,
        "description": created_organization.description,
        "country_code": created_organization.country_code,
        "timezone": created_organization.timezone,
        "subscription_plan": created_organization.subscription_plan,
        "max_users": created_organization.max_users,
        "logo_url": created_organization.logo_url,
        "primary_contact_email": created_organization.primary_contact_email,
        "primary_contact_name": created_organization.primary_contact_name,
        "primary_contact_phone": created_organization.primary_contact_phone,
        "is_active": created_organization.is_active,
        "created_at": created_organization.created_at,
        "updated_at": created_organization.updated_at,
        "current_users_count": 3,  # Los 3 usuarios por defecto
        "default_users": created_organization.default_users
    }
    
    return response_data

@router.get("", response_model=List[OrganizationOut])
def read_organizations(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Solo super usuarios pueden listar todas las organizaciones
    if current_user.role != 'super_user':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los super usuarios pueden listar organizaciones"
        )
    
    return organization_crud.get_organizations(db, skip=skip, limit=limit)

@router.get("/stats", response_model=Dict[str, Any])
def get_organizations_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener estadísticas de organizaciones (solo para super usuarios)
    """
    # Solo super usuarios pueden ver estadísticas de organizaciones
    if current_user.role != 'super_user':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los super usuarios pueden ver estadísticas de organizaciones"
        )
    
    try:
        from sqlalchemy import func
        from app.models.user_models import User
        from datetime import datetime, timedelta
        
        # Total de organizaciones
        total_orgs = db.query(func.count(Organization.organization_id)).scalar()
        
        # Organizaciones activas
        active_orgs = db.query(func.count(Organization.organization_id)).filter(
            Organization.is_active == True
        ).scalar()
        
        # Organizaciones inactivas (calcular directamente en lugar de restar)
        inactive_orgs = db.query(func.count(Organization.organization_id)).filter(
            Organization.is_active == False
        ).scalar()
        
        # Organizaciones creadas este mes
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_this_month = db.query(func.count(Organization.organization_id)).filter(
            Organization.created_at >= current_month
        ).scalar()
        
        # Organizaciones creadas el mes pasado para calcular el cambio
        last_month = (current_month - timedelta(days=1)).replace(day=1)
        new_last_month = db.query(func.count(Organization.organization_id)).filter(
            Organization.created_at >= last_month,
            Organization.created_at < current_month
        ).scalar()
        
        # Estadísticas por plan de suscripción
        free_orgs = db.query(func.count(Organization.organization_id)).filter(
            Organization.subscription_plan == 'free'
        ).scalar()
        
        premium_orgs = db.query(func.count(Organization.organization_id)).filter(
            Organization.subscription_plan == 'premium'
        ).scalar()
        
        corporate_orgs = db.query(func.count(Organization.organization_id)).filter(
            Organization.subscription_plan == 'corporate'
        ).scalar()
        
        # Calcular cambios
        total_change = f"+{new_this_month}" if new_this_month > 0 else "0"
        active_change = f"+{max(0, new_this_month)}" if new_this_month > 0 else "0"
        inactive_change = f"+{max(0, inactive_orgs - (total_orgs - new_this_month))}" if inactive_orgs > 0 else "0"
        new_change = f"+{new_this_month}" if new_this_month > 0 else "0"
        
        return {
            "total_organizations": {
                "value": str(total_orgs),
                "change": total_change
            },
            "active_organizations": {
                "value": str(active_orgs),
                "change": active_change
            },
            "inactive_organizations": {
                "value": str(inactive_orgs),
                "change": inactive_change
            },
            "new_this_month": {
                "value": str(new_this_month),
                "change": new_change
            },
            "free_organizations": {
                "value": str(free_orgs),
                "change": "+0"
            },
            "premium_organizations": {
                "value": str(premium_orgs),
                "change": "+0"
            },
            "corporate_organizations": {
                "value": str(corporate_orgs),
                "change": "+0"
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )

# Rutas específicas de organización (deben ir antes de la ruta general)
@router.get("/{organization_id}/task-states", response_model=Dict[str, Any])
async def get_task_states(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener los estados de tareas de una organización
    """
    try:
        # Verificar que el usuario pertenezca a la organización
        if not current_user or current_user.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver los estados de esta organización"
            )

        # Obtener la organización
        organization = db.query(Organization).filter(
            Organization.organization_id == organization_id,
            Organization.is_active == True
        ).first()

        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organización no encontrada o inactiva"
            )

        # Si no hay estados definidos, devolver los predeterminados
        if not organization.task_states:
            return DEFAULT_TASK_STATES

        # Asegurar que los estados tengan la estructura correcta
        task_states = organization.task_states
        if not isinstance(task_states, dict) or 'states' not in task_states:
            return DEFAULT_TASK_STATES

        # Validar y normalizar cada estado
        normalized_states = []
        for state in task_states['states']:
            if isinstance(state, dict) and 'id' in state:
                normalized_state = {
                    'id': state['id'],
                    'label': state.get('label', f'Estado {state["id"]}'),
                    'icon': state.get('icon', '🔴'),
                    'color': state.get('color', 'red'),
                    'isDefault': state.get('isDefault', False),
                    'isProtected': state.get('isProtected', False)
                }
                normalized_states.append(normalized_state)

        result = {
            'states': normalized_states,
            'default_state': task_states.get('default_state', 1),
            'final_states': task_states.get('final_states', [3])
        }
        return result

    except HTTPException as he:
        raise he
    except Exception as e:
        return DEFAULT_TASK_STATES

@router.put("/{organization_id}/task-states", response_model=Dict[str, Any])
async def update_task_states(
    organization_id: int,
    task_states: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Actualizar los estados de tareas de una organización
    """
    try:
        # Verificar que el usuario pertenezca a la organización
        if current_user.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para modificar los estados de esta organización"
            )

        # Obtener la organización
        organization = db.query(Organization).filter(
            Organization.organization_id == organization_id
        ).first()

        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organización no encontrada"
            )

        # Validar estructura de datos
        if not isinstance(task_states, dict):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Los datos deben ser un objeto válido"
            )

        if "states" not in task_states or not isinstance(task_states["states"], list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El campo 'states' es obligatorio y debe ser una lista"
            )

        # Validar que los estados básicos estén presentes
        required_states = {1, 2, 3}  # IDs numéricos de los estados básicos
        provided_states = {state.get("id", 0) for state in task_states["states"]}
        
        missing_states = required_states - provided_states
        if missing_states:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Los estados básicos son obligatorios. Faltan IDs: {', '.join(map(str, missing_states))}"
            )

        # Validar que no se eliminen estados protegidos
        protected_states = {1, 3}  # Estados que no se pueden eliminar (Pendiente y Completada)
        for protected_id in protected_states:
            if protected_id not in provided_states:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"No se puede eliminar el estado protegido con ID: {protected_id}"
                )

        # Validar estructura de cada estado
        for i, state in enumerate(task_states["states"]):
            if not isinstance(state, dict):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El estado en la posición {i} debe ser un objeto válido"
                )
            
            if "id" not in state or not state["id"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"El estado en la posición {i} debe tener un ID válido"
                )

        # Actualizar los estados
        organization.task_states = task_states
        db.commit()
        db.refresh(organization)

        # Devolver los datos actualizados directamente
        return task_states

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.get("/{organization_id}/work-hours", response_model=Dict[str, Any])
async def get_work_hours_config(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener la configuración de horas de trabajo de una organización
    """
    try:
        # Verificar permisos
        if current_user.role != 'super_user' and current_user.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para ver esta organización"
            )
        
        # Obtener la organización
        organization = db.query(Organization).filter(
            Organization.organization_id == organization_id
        ).first()
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organización no encontrada"
            )
        
        return {
            "organization_id": organization_id,
            "work_hours_config": organization.work_hours_config
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener configuración: {str(e)}"
        )

@router.put("/{organization_id}/work-hours", response_model=Dict[str, Any])
async def update_work_hours_config(
    organization_id: int,
    work_hours_config: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Actualizar configuración de horas de trabajo de la organización"""
    try:
        # Verificar que el usuario pertenece a la organización
        if current_user.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para modificar esta organización"
            )
        
        # Obtener la organización
        organization = db.query(Organization).filter(
            Organization.organization_id == organization_id
        ).first()
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organización no encontrada"
            )
        
        # Validar configuración de horas de trabajo
        required_fields = ['start_time', 'end_time', 'working_days']
        for field in required_fields:
            if field not in work_hours_config:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Campo requerido: {field}"
                )
        
        # Calcular horas diarias
        try:
            start_time = datetime.strptime(work_hours_config['start_time'], '%H:%M').time()
            end_time = datetime.strptime(work_hours_config['end_time'], '%H:%M').time()
            
            # Calcular diferencia en horas
            start_dt = datetime.combine(datetime.today(), start_time)
            end_dt = datetime.combine(datetime.today(), end_time)
            
            if end_dt <= start_dt:
                end_dt += timedelta(days=1)
            
            daily_hours = (end_dt - start_dt).total_seconds() / 3600
            
            # Aplicar descuento de almuerzo si está configurado
            effective_daily_hours = daily_hours
            if 'lunch_break_start' in work_hours_config and 'lunch_break_end' in work_hours_config:
                lunch_start = datetime.strptime(work_hours_config['lunch_break_start'], '%H:%M').time()
                lunch_end = datetime.strptime(work_hours_config['lunch_break_end'], '%H:%M').time()
                
                lunch_start_dt = datetime.combine(datetime.today(), lunch_start)
                lunch_end_dt = datetime.combine(datetime.today(), lunch_end)
                
                if lunch_end_dt <= lunch_start_dt:
                    lunch_end_dt += timedelta(days=1)
                
                lunch_hours = (lunch_end_dt - lunch_start_dt).total_seconds() / 3600
                effective_daily_hours = daily_hours - lunch_hours
            
            work_hours_config['daily_hours'] = round(daily_hours, 2)
            work_hours_config['effective_daily_hours'] = round(effective_daily_hours, 2)
            
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Formato de hora inválido: {str(e)}"
            )
        
        # Actualizar configuración
        organization.work_hours_config = work_hours_config
        db.commit()
        db.refresh(organization)
        
        return {
            "message": "Configuración de horas de trabajo actualizada exitosamente",
            "work_hours_config": organization.work_hours_config
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando configuración de horas de trabajo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.get("/{organization_id}/activity-categories", response_model=Dict[str, Any])
async def get_activity_categories(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener categorías de actividad de la organización"""
    try:
        # Verificar que el usuario pertenece a la organización
        if current_user.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para acceder a esta organización"
            )
        
        # Obtener la organización
        organization = db.query(Organization).filter(
            Organization.organization_id == organization_id
        ).first()
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organización no encontrada"
            )
        
        return {
            "message": "Categorías de actividad obtenidas exitosamente",
            "activity_categories": organization.activity_categories
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo categorías de actividad: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.put("/{organization_id}/activity-categories", response_model=Dict[str, Any])
async def update_activity_categories(
    organization_id: int,
    activity_categories: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Actualizar categorías de actividad de la organización"""
    try:
        # Verificar que el usuario pertenece a la organización
        if current_user.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para modificar esta organización"
            )
        
        # Obtener la organización
        organization = db.query(Organization).filter(
            Organization.organization_id == organization_id
        ).first()
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organización no encontrada"
            )
        
        # Validar estructura de categorías
        if 'categories' not in activity_categories:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Campo requerido: categories"
            )
        
        categories = activity_categories['categories']
        if not isinstance(categories, list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="categories debe ser una lista"
            )
        
        # Validar cada categoría
        for i, category in enumerate(categories):
            if not isinstance(category, dict):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Categoría {i} debe ser un objeto"
                )
            
            required_fields = ['id', 'name']
            for field in required_fields:
                if field not in category:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Campo requerido en categoría {i}: {field}"
                    )
            
            # Validar que el ID sea un entero
            try:
                category['id'] = int(category['id'])
            except (ValueError, TypeError):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"ID de categoría {i} debe ser un número entero"
                )
        
        # Verificar que no haya IDs duplicados
        ids = [cat['id'] for cat in categories]
        if len(ids) != len(set(ids)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se permiten IDs duplicados en las categorías"
            )
        
        # Actualizar categorías
        organization.activity_categories = categories
        db.commit()
        db.refresh(organization)
        
        return {
            "message": "Categorías de actividad actualizadas exitosamente",
            "activity_categories": organization.activity_categories
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando categorías de actividad: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

# Rutas de calificaciones para usuarios externos (sin autenticación de usuario interno)
@router.get("/{organization_id}/super-users", response_model=List[Dict[str, Any]])
def get_organization_super_users(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener los super usuarios de una organización (solo para super usuarios del sistema)"""
    # Solo super usuarios del sistema pueden ver esta información
    if current_user.role != 'super_user':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los super usuarios pueden ver esta información"
        )
    
    super_users = organization_crud.get_organization_super_users(db, organization_id)
    return super_users

@router.post("/{organization_id}/ratings/external", response_model=OrganizationRatingOut)
def create_organization_rating_external(
    organization_id: int,
    rating: OrganizationRatingCreate,
    db: Session = Depends(get_db)
):
    """Crear o actualizar una calificación para una organización (ruta pública para usuarios externos)"""
    return organization_crud.create_or_update_organization_rating(db, organization_id, rating)

@router.get("/{organization_id}/ratings/external", response_model=List[OrganizationRatingOut])
def read_organization_ratings_external(
    organization_id: int,
    skip: int = 0,
    limit: int = 100,
    client_id: int = None,
    db: Session = Depends(get_db)
):
    """Obtener calificaciones de una organización (ruta pública)"""
    return organization_crud.get_organization_ratings(db, organization_id, skip, limit, client_id)

@router.get("/{organization_id}/ratings/external/stats", response_model=OrganizationRatingStats)
def get_organization_rating_stats_external(
    organization_id: int,
    client_id: int = None,
    db: Session = Depends(get_db)
):
    """Obtener estadísticas de calificaciones de una organización (ruta pública)"""
    return organization_crud.get_organization_rating_stats(db, organization_id, client_id)

@router.get("/{organization_id}/ratings/external/user/{external_user_id}/client/{client_id}", response_model=OrganizationRatingOut)
def get_user_rating_external(
    organization_id: int,
    external_user_id: int,
    client_id: int,
    db: Session = Depends(get_db)
):
    """Obtener la calificación específica de un usuario para un cliente (ruta pública)"""
    rating = organization_crud.get_user_rating(db, organization_id, external_user_id, client_id)
    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calificación no encontrada"
        )
    return rating

# Rutas de calificaciones para usuarios internos (con autenticación)
@router.post("/{organization_id}/ratings", response_model=OrganizationRatingOut)
def create_organization_rating(
    organization_id: int,
    rating: OrganizationRatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Crear una calificación para una organización"""
    # Verificar que el usuario pertenezca a la organización
    if current_user.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para calificar esta organización"
        )
    
    return organization_crud.create_organization_rating(db, organization_id, rating)

@router.get("/{organization_id}/ratings", response_model=List[OrganizationRatingOut])
def read_organization_ratings(
    organization_id: int,
    skip: int = 0,
    limit: int = 100,
    client_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener calificaciones de una organización"""
    # Verificar que el usuario pertenezca a la organización
    if current_user.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver las calificaciones de esta organización"
        )
    
    return organization_crud.get_organization_ratings(db, organization_id, skip, limit, client_id)

@router.get("/{organization_id}/ratings/stats", response_model=OrganizationRatingStats)
def get_organization_rating_stats(
    organization_id: int,
    client_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener estadísticas de calificaciones de una organización"""
    # Verificar que el usuario pertenezca a la organización
    if current_user.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver las estadísticas de esta organización"
        )
    
    return organization_crud.get_organization_rating_stats(db, organization_id, client_id)

@router.put("/{organization_id}/ratings/{rating_id}", response_model=OrganizationRatingOut)
def update_organization_rating(
    organization_id: int,
    rating_id: int,
    rating: OrganizationRatingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Actualizar una calificación de organización"""
    # Verificar que el usuario pertenezca a la organización
    if current_user.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para actualizar calificaciones de esta organización"
        )
    
    return organization_crud.update_organization_rating(db, rating_id, rating)

@router.delete("/{organization_id}/ratings/{rating_id}", response_model=OrganizationRatingOut)
def delete_organization_rating(
    organization_id: int,
    rating_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Eliminar una calificación de organización"""
    # Verificar que el usuario pertenezca a la organización
    if current_user.organization_id != organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar calificaciones de esta organización"
        )
    
    return organization_crud.delete_organization_rating(db, rating_id)

# Ruta general de organización (debe ir al final)
@router.get("/{organization_id}", response_model=OrganizationWithDetails)
def read_organization(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Solo super usuarios pueden ver los detalles de organizaciones
    if current_user.role != 'super_user':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los super usuarios pueden ver detalles de organizaciones"
        )
    
    organization = organization_crud.get_organization_details(db, organization_id)
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organización no encontrada"
        )
    
    return organization

@router.put("/{organization_id}", response_model=OrganizationOut)
def update_organization(
    organization_id: int,
    organization: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Solo super usuarios pueden actualizar organizaciones
    if current_user.role != 'super_user':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los super usuarios pueden actualizar organizaciones"
        )
    
    updated_organization = organization_crud.update_organization(db, organization_id, organization)
    if not updated_organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organización no encontrada"
        )
    
    return updated_organization

@router.delete("/{organization_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Solo super usuarios pueden eliminar organizaciones
    if current_user.role != 'super_user':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los super usuarios pueden eliminar organizaciones"
        )
    
    success = organization_crud.delete_organization(db, organization_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organización no encontrada"
        )

@router.get("/{organization_id}/kanban-states", response_model=Dict[str, Any])
async def get_kanban_states(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener los estados kanban de una organización
    """
    try:
        # Verificar que el usuario pertenezca a la organización
        if not current_user or current_user.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver los estados de esta organización"
            )

        # Obtener la organización
        organization = db.query(Organization).filter(
            Organization.organization_id == organization_id,
            Organization.is_active == True
        ).first()

        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organización no encontrada o inactiva"
            )

        # Si no hay estados definidos, devolver los predeterminados
        if not organization.kanban_states:
            return Organization.DEFAULT_KANBAN_STATES

        # Asegurar que los estados tengan la estructura correcta
        kanban_states = organization.kanban_states
        if not isinstance(kanban_states, dict) or 'states' not in kanban_states:
            return Organization.DEFAULT_KANBAN_STATES

        # Validar y normalizar cada estado
        normalized_states = []
        for state in kanban_states['states']:
            if isinstance(state, dict) and 'id' in state:
                normalized_state = {
                    'id': state['id'],
                    'key': state.get('key', f"state_{state['id']}"),  # Preservar la clave del estado
                    'label': state.get('label', 'Estado'),
                    'color': state.get('color', 'bg-gray-100'),
                    'textColor': state.get('textColor', 'text-gray-700'),
                    'isDefault': state.get('isDefault', False),
                    'isProtected': state.get('isProtected', False)
                }
                normalized_states.append(normalized_state)

        # Devolver estados normalizados
        return {
            'states': normalized_states,
            'default_state': kanban_states.get('default_state', 2),
            'final_states': kanban_states.get('final_states', [5])
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error al obtener estados kanban: {str(e)}")
        return Organization.DEFAULT_KANBAN_STATES

@router.put("/{organization_id}/kanban-states", response_model=OrganizationOut)
def update_kanban_states(
    organization_id: int,
    kanban_states_update: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Actualiza los estados kanban de la organización."""
    try:
        # Verificar que el usuario pertenezca a la organización
        if not current_user or current_user.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para actualizar los estados de esta organización"
            )

        # Obtener la organización directamente por ID
        organization = get_organization(db, organization_id)
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organización no encontrada"
            )

        # Validar que los estados obligatorios estén presentes
        if 'kanban_states' not in kanban_states_update:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Datos de estados kanban requeridos"
            )

        kanban_states_data = kanban_states_update['kanban_states']
        
        # Validar estructura de estados
        if 'states' not in kanban_states_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Lista de estados requerida"
            )

        states = kanban_states_data['states']
        
        # Validar que existan los estados obligatorios
        required_states = [1, 5]  # IDs de los estados obligatorios (backlog y done)
        existing_ids = [state.get('id') for state in states if state.get('id') is not None]
        
        # Verificar que los estados obligatorios estén presentes
        missing_states = []
        for required_state in required_states:
            if required_state not in existing_ids:
                missing_states.append(required_state)
        
        if missing_states:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Los estados con IDs {', '.join(map(str, missing_states))} son obligatorios y no pueden eliminarse"
            )

        # Actualizar los estados kanban en la organización
        organization.kanban_states = kanban_states_data
        db.commit()
        db.refresh(organization)

        return organization

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error actualizando estados kanban: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}"
        ) 