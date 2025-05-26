from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
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