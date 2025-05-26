from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

# from backend.app.schemas.project_schema import ProjectCreate, ProjectUpdate
# from backend.app.crud import project_crud as crud
# from app.core.database import get_db

from app.schemas.project_schema import ProjectCreate, ProjectUpdate, ProjectOut
from app.crud import project_crud
from app.core.database import get_db
from app.core.security import get_current_user_organization
from app.models.user_models import User
from app.models.organization_models import Organization

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    project: ProjectCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Crear un nuevo proyecto para la organización del usuario actual
    """
    try:
        # Usar la organización del usuario actual
        project.organization_id = current_user.organization_id
        return project_crud.create_project(db, project)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=List[ProjectOut])
def read_projects(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener proyectos de la organización del usuario actual
    """
    try:
        # Verificar si el usuario tiene una organización
        if not current_user or not current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="El usuario no tiene una organización asignada"
            )

        # Obtener la organización
        organization = db.query(Organization).filter(
            Organization.organization_id == current_user.organization_id
        ).first()

        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organización no encontrada"
            )

        proyectos = project_crud.get_projects_by_organization(
            db, 
            current_user.organization_id, 
            skip=skip, 
            limit=limit
        )
        
        return proyectos
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error al obtener proyectos: {str(e)}"
        )

@router.get("/{project_id}", response_model=ProjectOut)
def read_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener un proyecto específico de la organización del usuario
    """
    db_project = project_crud.get_project(db, project_id)
    
    # Verificar que el proyecto pertenezca a la organización del usuario
    if not db_project or db_project.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Proyecto no encontrado o no autorizado"
        )
    
    return db_project

@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int, 
    project: ProjectUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Actualizar un proyecto de la organización del usuario
    """
    try:
        # Verificar que el proyecto pertenezca a la organización del usuario
        existing_project = project_crud.get_project(db, project_id)
        if not existing_project or existing_project.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Proyecto no encontrado o no autorizado"
            )

        # Mantener el organization_id original
        project.organization_id = existing_project.organization_id

        updated_project = project_crud.update_project(db, project_id, project)
        
        if not updated_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Proyecto no encontrado"
            )
        
        return updated_project
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{project_id}", response_model=ProjectOut)
def delete_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Eliminar un proyecto de la organización del usuario
    """
    try:
        # Verificar que el proyecto pertenezca a la organización del usuario
        existing_project = project_crud.get_project(db, project_id)
        if not existing_project or existing_project.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Proyecto no encontrado o no autorizado"
            )

        deleted_project = project_crud.delete_project(db, project_id)
        
        if not deleted_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Proyecto no encontrado"
            )
        
        return deleted_project
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))