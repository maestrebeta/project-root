from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.schemas.user_schema import ExternalUserCreate, ExternalUserUpdate, ExternalUserOut, ExternalUserStatusUpdate, ExternalUserLogin, ExternalUserLoginResponse
from app.crud import user_crud
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user, get_current_external_user
from datetime import timedelta

router = APIRouter(prefix="/external-users", tags=["External Users"])

@router.post("/register", response_model=ExternalUserOut)
def register_external_user(external_user: ExternalUserCreate, db: Session = Depends(get_db)):
    """Registrar un nuevo usuario externo"""
    
    # Verificar si el email ya existe
    db_user = user_crud.get_external_user_by_email(db, email=external_user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Verificar si el username ya existe
    db_user = user_crud.get_external_user_by_username(db, username=external_user.username)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya está en uso"
        )
    
    return user_crud.create_external_user(db=db, external_user=external_user)

@router.post("/login", response_model=ExternalUserLoginResponse)
def login_external_user(external_user_login: ExternalUserLogin, db: Session = Depends(get_db)):
    """Autenticar un usuario externo"""
    
    external_user = user_crud.authenticate_external_user(
        db, 
        email=external_user_login.email, 
        password=external_user_login.password
    )
    
    if not external_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crear token de acceso
    access_token_expires = timedelta(minutes=30)  # Tokens más cortos para usuarios externos
    access_token = create_access_token(
        data={"sub": f"external_{external_user.external_user_id}", "type": "external"}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": external_user
    }

@router.get("/{external_user_id}/validate")
def validate_external_user_session(
    external_user_id: int, 
    db: Session = Depends(get_db),
    current_external_user = Depends(get_current_external_user)
):
    """Validar la sesión de un usuario externo"""
    
    # Verificar que el usuario del token coincide con el ID solicitado
    if current_external_user.external_user_id != external_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No autorizado para validar esta sesión"
        )
    
    # Verificar que el usuario existe y está activo
    db_external_user = user_crud.get_external_user(db, external_user_id=external_user_id)
    if not db_external_user:
        return {"valid": False, "message": "Usuario no encontrado"}
    
    if not db_external_user.is_active:
        return {"valid": False, "message": "Usuario inactivo"}
    
    # Usuario válido, devolver datos actualizados
    return {
        "valid": True, 
        "user": db_external_user,
        "message": "Sesión válida"
    }

@router.get("/", response_model=List[ExternalUserOut])
def read_external_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener lista de usuarios externos de la organización del usuario logueado"""
    external_users = user_crud.get_external_users_by_organization(
        db, 
        organization_id=current_user.organization_id,
        skip=skip, 
        limit=limit
    )
    return external_users

@router.get("/check-email")
def check_external_user_exists(email: str, db: Session = Depends(get_db)):
    """Verificar si un email ya está registrado"""
    return user_crud.check_external_user_exists(db, email=email)

@router.get("/{external_user_id}", response_model=ExternalUserOut)
def read_external_user(
    external_user_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Obtener un usuario externo específico de la organización"""
    db_external_user = user_crud.get_external_user_by_organization(
        db, 
        external_user_id=external_user_id,
        organization_id=current_user.organization_id
    )
    if db_external_user is None:
        raise HTTPException(status_code=404, detail="Usuario externo no encontrado")
    return db_external_user

@router.put("/{external_user_id}", response_model=ExternalUserOut)
def update_external_user(
    external_user_id: int, 
    external_user: ExternalUserUpdate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualizar un usuario externo de la organización"""
    db_external_user = user_crud.update_external_user_by_organization(
        db, 
        external_user_id=external_user_id, 
        external_user=external_user,
        organization_id=current_user.organization_id
    )
    if db_external_user is None:
        raise HTTPException(status_code=404, detail="Usuario externo no encontrado")
    return db_external_user

@router.patch("/{external_user_id}/status", response_model=ExternalUserOut)
def update_external_user_status(
    external_user_id: int, 
    status_update: ExternalUserStatusUpdate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Actualizar el estado de un usuario externo (activo/inactivo)"""
    db_external_user = user_crud.update_external_user_status_by_organization(
        db, 
        external_user_id=external_user_id, 
        status_update=status_update,
        organization_id=current_user.organization_id
    )
    if db_external_user is None:
        raise HTTPException(status_code=404, detail="Usuario externo no encontrado")
    return db_external_user

@router.delete("/{external_user_id}", response_model=ExternalUserOut)
def delete_external_user(
    external_user_id: int, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Eliminar un usuario externo de la organización"""
    db_external_user = user_crud.delete_external_user_by_organization(
        db, 
        external_user_id=external_user_id,
        organization_id=current_user.organization_id
    )
    if db_external_user is None:
        raise HTTPException(status_code=404, detail="Usuario externo no encontrado")
    return db_external_user 