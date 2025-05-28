from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_organization
from app.models.user_models import User
from app.models.organization_models import Organization
from app.schemas.organization_schema import (
    OrganizationCreate, 
    OrganizationUpdate, 
    OrganizationOut, 
    OrganizationWithDetails
)
from app.crud import organization_crud

router = APIRouter(
    prefix="/organizations",
    tags=["organizations"]
)

# Estados predeterminados del sistema
DEFAULT_TASK_STATES = {
    "states": [
        {
            "id": "pendiente",
            "label": "Pendiente",
            "icon": "🔴",
            "color": "red"
        },
        {
            "id": "en_progreso",
            "label": "En Progreso",
            "icon": "🔵",
            "color": "blue"
        },
        {
            "id": "completada",
            "label": "Completada",
            "icon": "🟢",
            "color": "green"
        }
    ],
    "default_state": "pendiente",
    "final_states": ["completada"]
}

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
    
    return organization_crud.create_organization(db, organization)

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
        
        # Organizaciones inactivas
        inactive_orgs = total_orgs - active_orgs
        
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
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )

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
    
    updated_org = organization_crud.update_organization(db, organization_id, organization)
    if not updated_org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organización no encontrada"
        )
    
    return updated_org

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
                    'label': state.get('label', state['id'].capitalize()),
                    'icon': state.get('icon', '🔴'),
                    'color': state.get('color', 'red'),
                    'isDefault': state.get('isDefault', False)
                }
                normalized_states.append(normalized_state)

        # Devolver estados normalizados
        return {
            'states': normalized_states,
            'default_state': task_states.get('default_state', 'pendiente'),
            'final_states': task_states.get('final_states', ['completada'])
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error al obtener estados: {str(e)}")
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

    # Validar que los estados básicos estén presentes
    required_states = {"pendiente", "en_progreso", "completada"}
    provided_states = {state["id"] for state in task_states["states"]}
    
    if not required_states.issubset(provided_states):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Los estados básicos (pendiente, en_progreso, completada) son obligatorios"
        )

    # Actualizar los estados
    organization.task_states = task_states
    db.commit()
    db.refresh(organization)

    return organization.task_states

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
    """
    Actualizar la configuración de horas de trabajo de una organización
    """
    try:
        # Verificar permisos
        if current_user.role != 'super_user' and current_user.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para actualizar esta organización"
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
        
        # Validar estructura de configuración
        required_fields = ['start_time', 'end_time', 'working_days']
        for field in required_fields:
            if field not in work_hours_config:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Campo requerido faltante: {field}"
                )
        
        # Validar formato de horas
        import re
        time_pattern = r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
        if not re.match(time_pattern, work_hours_config['start_time']):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de hora de inicio inválido (use HH:MM)"
            )
        
        if not re.match(time_pattern, work_hours_config['end_time']):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de hora de fin inválido (use HH:MM)"
            )
        
        # Validar días laborables
        if not isinstance(work_hours_config['working_days'], list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Los días laborables deben ser una lista"
            )
        
        for day in work_hours_config['working_days']:
            if not isinstance(day, int) or day < 1 or day > 7:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Los días laborables deben ser números del 1 al 7"
                )
        
        # Calcular horas efectivas automáticamente
        from datetime import datetime, time
        start_time = datetime.strptime(work_hours_config['start_time'], '%H:%M').time()
        end_time = datetime.strptime(work_hours_config['end_time'], '%H:%M').time()
        
        # Calcular horas totales del día
        start_minutes = start_time.hour * 60 + start_time.minute
        end_minutes = end_time.hour * 60 + end_time.minute
        total_minutes = end_minutes - start_minutes
        daily_hours = total_minutes / 60
        
        # Descontar almuerzo si está configurado
        lunch_minutes = 0
        if 'lunch_break_start' in work_hours_config and 'lunch_break_end' in work_hours_config:
            lunch_start = datetime.strptime(work_hours_config['lunch_break_start'], '%H:%M').time()
            lunch_end = datetime.strptime(work_hours_config['lunch_break_end'], '%H:%M').time()
            lunch_start_minutes = lunch_start.hour * 60 + lunch_start.minute
            lunch_end_minutes = lunch_end.hour * 60 + lunch_end.minute
            lunch_minutes = lunch_end_minutes - lunch_start_minutes
        
        effective_daily_hours = (total_minutes - lunch_minutes) / 60
        
        # Actualizar configuración con valores calculados
        work_hours_config['daily_hours'] = round(daily_hours, 2)
        work_hours_config['effective_daily_hours'] = round(effective_daily_hours, 2)
        
        # Actualizar la organización
        organization.work_hours_config = work_hours_config
        db.commit()
        
        return {
            "message": "Configuración de horas de trabajo actualizada exitosamente",
            "organization_id": organization_id,
            "work_hours_config": work_hours_config
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar configuración: {str(e)}"
        ) 