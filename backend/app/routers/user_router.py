from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload
from typing import List, Optional
# from app.schemas import user_schema
from app.schemas.user_schema import UserCreate, UserUpdate, UserOut, ThemePreferences
from app.crud import user_crud
from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash, get_current_user_organization
from app.models.user_models import User
import json
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

def validate_user_role(current_user: User, target_role: str):
    """
    Validar si el usuario actual tiene permiso para crear/modificar usuarios con un rol específico
    """
    # Solo admin y super_user pueden crear/modificar usuarios con roles admin o super_user
    if target_role in ['admin', 'super_user']:
        if current_user.role not in ['admin', 'super_user']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo administradores pueden crear usuarios con rol de administrador o super usuario"
            )

@router.get("", response_model=List[UserOut])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    logger.info(f"Obteniendo usuarios para la organización {current_user.organization_id}")
    
    try:
        # Cargar explícitamente la relación de organización
        users = (
            db.query(User)
            .options(joinedload(User.organization))
            .filter(User.organization_id == current_user.organization_id)
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        # Logging detallado de usuarios
        for user in users:
            org_name = user.organization.name if user.organization else 'Sin organización'
            logger.info(f"Usuario: {user.username}, Org ID: {user.organization_id}, Org Name: {org_name}")
        
        return users
    
    except Exception as e:
        logger.error(f"Error al obtener usuarios: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Usuario {current_user.username} solicitando detalles del usuario {user_id}")
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

@router.post("", response_model=UserOut)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validar rol del usuario
    validate_user_role(current_user, user.role)
    
    logger.info(f"Usuario {current_user.username} intentando crear nuevo usuario")
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email ya registrado")
    
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username ya registrado")
    
    hashed_password = get_password_hash(user.password)
    theme_prefs = user.theme_preferences.dict() if user.theme_preferences else None
    
    # Asignar la organización del usuario actual si no se proporciona
    organization_id = user.organization_id or current_user.organization_id
    
    logger.info(f"Creando usuario con organization_id: {organization_id}")
    
    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        password_hash=hashed_password,
        role=user.role,
        is_active=user.is_active,
        profile_image=user.profile_image,
        theme_preferences=theme_prefs,
        organization_id=organization_id  # Usar la organización del usuario actual
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info(f"Usuario {user.username} creado exitosamente")
    return db_user

@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Si se está cambiando el rol, validar permisos
    if user.role:
        validate_user_role(current_user, user.role)
    
    try:
        logger.info(f"Usuario {current_user.username} intentando actualizar usuario {user_id}")
        db_user = db.query(User).filter(User.user_id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Actualizar campos si están presentes en la solicitud
        if user.email is not None:
            existing_user = db.query(User).filter(User.email == user.email).first()
            if existing_user and existing_user.user_id != user_id:
                raise HTTPException(status_code=400, detail="Email ya registrado")
            db_user.email = user.email
        
        if user.full_name is not None:
            db_user.full_name = user.full_name
        
        if user.role is not None:
            db_user.role = user.role
        
        if user.is_active is not None:
            db_user.is_active = user.is_active
        
        if user.password is not None:
            db_user.password_hash = get_password_hash(user.password)
        
        if user.profile_image is not None:
            db_user.profile_image = user.profile_image
        
        if user.theme_preferences is not None:
            # Convertir ThemePreferences a diccionario
            theme_prefs = user.theme_preferences.dict()
            db_user.theme_preferences = theme_prefs
        
        if user.organization_id is not None:
            db_user.organization_id = user.organization_id
            logger.info(f"Actualizando organization_id a: {user.organization_id}")
        
        # Justo antes de hacer el commit en el método update_user
        logger.info(f"Datos de usuario a actualizar: {user}")
        logger.info(f"organization_id recibido: {user.organization_id}")
        logger.info(f"Tipo de organization_id: {type(user.organization_id)}")
        
        db.commit()
        db.refresh(db_user)
        logger.info(f"Usuario {user_id} actualizado exitosamente por {current_user.username}")
        return db_user
    except Exception as e:
        logger.error(f"Error actualizando usuario {user_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error actualizando usuario: {str(e)}"
        )

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Usuario {current_user.username} intentando eliminar usuario {user_id}")
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    db.delete(db_user)
    db.commit()
    logger.info(f"Usuario {user_id} eliminado exitosamente por {current_user.username}")
    return None

@router.patch("/{user_id}/theme", response_model=UserOut)
def update_user_theme(
    user_id: int,
    theme_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        logger.info(f"Usuario {current_user.username} actualizando tema para usuario {user_id}")
        db_user = db.query(User).filter(User.user_id == user_id).first()
        
        if not db_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Verificar que el usuario actual es el mismo que se está actualizando o es administrador
        if current_user.user_id != user_id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para actualizar este usuario"
            )
        
        # Actualizar solo las preferencias de tema
        if "theme_preferences" in theme_data:
            theme_prefs = theme_data["theme_preferences"]
            
            # Validar que los campos requeridos estén presentes
            required_fields = ["primary_color", "font_class", "font_size_class", "animations_enabled"]
            if not all(field in theme_prefs for field in required_fields):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Faltan campos requeridos en theme_preferences"
                )
            
            # Actualizar el tema en la base de datos
            db_user.theme_preferences = theme_prefs
            
            db.commit()
            db.refresh(db_user)
            logger.info(f"Tema actualizado exitosamente para usuario {user_id}")
            return db_user
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se proporcionaron preferencias de tema"
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando tema para usuario {user_id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error actualizando tema: {str(e)}"
        )
