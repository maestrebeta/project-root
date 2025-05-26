from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import ValidationError

from app.schemas.time_entry_schema import TimeEntryCreate, TimeEntryUpdate, TimeEntryOut
from app.crud import time_entry_crud
from app.core.database import get_db
from app.core.security import get_current_user_organization
from app.models.user_models import User
from app.models.project_models import Project
from app.models.organization_models import Organization

router = APIRouter(prefix="/time-entries", tags=["Time Entries"])

@router.post("/", response_model=TimeEntryOut, status_code=status.HTTP_201_CREATED)
def create(
    entry: TimeEntryCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Crear una nueva entrada de tiempo
    
    Validaciones:
    - Verificar que el usuario pertenezca a la organización
    - Validar que el proyecto exista y pertenezca a la organización
    - Validar tipos de datos y campos requeridos
    """
    try:
        # Validar que el usuario pertenezca a la organización
        if current_user.organization_id != entry.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para crear entradas de tiempo en esta organización"
            )

        # Validar que el proyecto exista y pertenezca a la organización
        project = db.query(Project).filter(
            Project.project_id == entry.project_id,
            Project.organization_id == entry.organization_id
        ).first()

        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto no encontrado o no pertenece a la organización"
            )

        # Validar que end_time sea posterior a start_time si está presente
        if entry.end_time and entry.start_time:
            if entry.end_time < entry.start_time:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="La hora de fin debe ser posterior a la hora de inicio"
                )

        # Crear entrada de tiempo
        db_entry = time_entry_crud.create_time_entry(db, entry)
        return db_entry

    except ValidationError as ve:
        # Errores de validación de Pydantic
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except ValueError as ve:
        # Errores de validación de datos
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as e:
        # Errores internos del servidor
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al crear entrada de tiempo: {str(e)}"
        )

@router.get("/", response_model=List[TimeEntryOut])
def read_all(
    skip: int = 0, 
    limit: int = 100, 
    filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener entradas de tiempo para el usuario actual
    """
    try:
        # Filtrar por organización del usuario
        entries = time_entry_crud.get_time_entries_by_organization(
            db, 
            current_user.organization_id, 
            skip=skip, 
            limit=limit
        )
        return entries
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener entradas de tiempo: {str(e)}"
        )

@router.get("/{entry_id}", response_model=TimeEntryOut)
def read(
    entry_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener una entrada de tiempo específica
    """
    try:
        entry = time_entry_crud.get_time_entry(db, entry_id)
        
        if not entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entrada de tiempo no encontrada"
            )
        
        # Verificar que la entrada pertenezca a la organización del usuario
        if entry.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver esta entrada de tiempo"
            )
        
        return entry
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener entrada de tiempo: {str(e)}"
        )

@router.put("/{entry_id}", response_model=TimeEntryOut)
def update(
    entry_id: int, 
    entry: TimeEntryUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Actualizar una entrada de tiempo
    """
    try:
        # Verificar que la entrada pertenezca a la organización del usuario
        existing_entry = time_entry_crud.get_time_entry(db, entry_id)
        
        if not existing_entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entrada de tiempo no encontrada"
            )
        
        if existing_entry.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para actualizar esta entrada de tiempo"
            )

        updated_entry = time_entry_crud.update_time_entry(db, entry_id, entry)
        
        if not updated_entry:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo actualizar la entrada de tiempo"
            )
        
        return updated_entry
    
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar entrada de tiempo: {str(e)}"
        )

@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(
    entry_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Eliminar una entrada de tiempo
    """
    try:
        # Verificar que la entrada pertenezca a la organización del usuario
        existing_entry = time_entry_crud.get_time_entry(db, entry_id)
        
        if not existing_entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entrada de tiempo no encontrada"
            )
        
        if existing_entry.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para eliminar esta entrada de tiempo"
            )

        success = time_entry_crud.delete_time_entry(db, entry_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo eliminar la entrada de tiempo"
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar entrada de tiempo: {str(e)}"
        )
