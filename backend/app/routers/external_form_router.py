from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_organization
from app.models.user_models import User
from app.models.external_form_models import ExternalForm
from app.schemas.external_form_schema import (
    ExternalFormCreate, 
    ExternalFormUpdate, 
    ExternalFormOut, 
    ExternalFormWithDetails
)
from app.crud import external_form_crud

router = APIRouter(
    prefix="/external-forms",
    tags=["external-forms"]
)

@router.post("", response_model=ExternalFormOut)
def create_external_form(
    form: ExternalFormCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear un nuevo formulario externo para la organización"""
    # Verificar permisos
    if current_user.role not in ['admin', 'super_user']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden crear formularios externos"
        )
    
    # Verificar que el formulario sea para la organización del usuario
    if form.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes crear formularios para tu organización"
        )
    
    # Verificar si ya existe un formulario activo
    existing_form = external_form_crud.get_external_form_by_organization(db, form.organization_id)
    if existing_form:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe un formulario activo para esta organización. Debes eliminar el existente primero."
        )
    
    return external_form_crud.create_external_form(db, form, current_user.user_id)

@router.get("/organization", response_model=ExternalFormOut)
def get_organization_external_form(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener el formulario externo activo de la organización del usuario"""
    form = external_form_crud.get_external_form_by_organization(db, current_user.organization_id)
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró un formulario externo activo para esta organización"
        )
    return form

@router.get("/token/{form_token}", response_model=ExternalFormOut)
def get_external_form_by_token(
    form_token: str,
    db: Session = Depends(get_db)
):
    """Obtener formulario externo por token (público)"""
    form = external_form_crud.get_external_form_by_token(db, form_token)
    if not form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formulario no encontrado o inactivo"
        )
    return form

@router.put("/{form_id}", response_model=ExternalFormOut)
def update_external_form(
    form_id: int,
    form: ExternalFormUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar formulario externo"""
    # Verificar permisos
    if current_user.role not in ['admin', 'super_user']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden actualizar formularios externos"
        )
    
    # Verificar que el formulario pertenezca a la organización del usuario
    existing_form = db.query(ExternalForm).filter(
        ExternalForm.form_id == form_id
    ).first()
    
    if not existing_form or existing_form.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formulario no encontrado"
        )
    
    updated_form = external_form_crud.update_external_form(db, form_id, form)
    if not updated_form:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formulario no encontrado"
        )
    
    return updated_form

@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_external_form(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar (desactivar) formulario externo"""
    # Verificar permisos
    if current_user.role not in ['admin', 'super_user']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden eliminar formularios externos"
        )
    
    # Verificar que el formulario pertenezca a la organización del usuario
    existing_form = db.query(ExternalForm).filter(
        ExternalForm.form_id == form_id
    ).first()
    
    if not existing_form or existing_form.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formulario no encontrado"
        )
    
    success = external_form_crud.delete_external_form(db, form_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formulario no encontrado"
        )

@router.get("/{form_id}/details", response_model=ExternalFormWithDetails)
def get_external_form_details(
    form_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener detalles completos del formulario externo"""
    # Verificar permisos
    if current_user.role not in ['admin', 'super_user']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden ver detalles de formularios externos"
        )
    
    form_details = external_form_crud.get_external_form_details(db, form_id)
    if not form_details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Formulario no encontrado"
        )
    
    # Verificar que el formulario pertenezca a la organización del usuario
    if form_details['organization_id'] != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver este formulario"
        )
    
    return form_details 