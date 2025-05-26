from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user_models import User
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