import logging
from datetime import timedelta, datetime, timezone
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.crud import user_crud
from app.schemas import auth_schema, user_schema
from app.core.security import create_access_token, verify_password, get_current_user, get_current_user_organization, validate_organization_subscription, get_organization_subscription_info
from app.core.config import settings
from app.models.user_models import User, ExternalUser

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración de JWT
SECRET_KEY = "tu_clave_secreta_super_segura_cambiame_en_produccion"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 horas

# Usar el mismo contexto de hashing que en user_crud
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_password_hash(password):
    return pwd_context.hash(password)

@router.post("/login", response_model=auth_schema.LoginResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Endpoint de login que también valida el estado de suscripción de la organización
    """
    user = user_crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    
    # Verificar suscripción de la organización (excepto para super usuarios)
    if user.role != 'super_user' and user.organization_id:
        from app.models.organization_models import Organization
        organization = db.query(Organization).filter(
            Organization.organization_id == user.organization_id
        ).first()
        
        if organization:
            if not organization.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="La organización está inactiva. Contacta a soporte para más información."
                )
            
            if not organization.is_subscription_active:
                # Determinar el motivo del bloqueo
                if organization.subscription_status == 'suspended':
                    reason = "La suscripción ha sido suspendida"
                elif organization.subscription_plan == 'free' and organization.trial_end_date and organization.trial_end_date < datetime.now(timezone.utc):
                    reason = "El período de prueba gratuita ha expirado"
                elif organization.subscription_end_date and organization.subscription_end_date < datetime.now(timezone.utc):
                    reason = "La suscripción ha expirado"
                else:
                    reason = "Problema con la suscripción"
                
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Acceso bloqueado: {reason}. Contacta a soporte para renovar tu plan."
                )
    
    # Crear token de acceso
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "email": user.email, "role": user.role}, 
        expires_delta=access_token_expires
    )
    
    # Actualizar último login
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    
    # Preparar información del usuario para la respuesta
    user_info = auth_schema.UserInfo(
        user_id=user.user_id,
        username=user.username,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        organization_id=user.organization_id,
        profile_image=user.profile_image,
        theme_preferences=user.theme_preferences,
        last_login=user.last_login
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user_info
    }

@router.post("/external/login", response_model=auth_schema.Token)
def external_login(login_data: user_schema.ExternalUserLogin, db: Session = Depends(get_db)):
    external_user = user_crud.authenticate_external_user(db, login_data.email, login_data.password)
    if not external_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not external_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    
    # Verificar suscripción de la organización
    if external_user.organization_id:
        from app.models.organization_models import Organization
        organization = db.query(Organization).filter(
            Organization.organization_id == external_user.organization_id
        ).first()
        
        if organization and not organization.is_subscription_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acceso bloqueado: La suscripción de la organización ha expirado."
            )
    
    access_token_expires = timedelta(hours=24)  # Tokens más largos para usuarios externos
    access_token = user_crud.create_external_user_token(external_user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_at": external_user.expires_at,
        "external_user": {
            "external_user_id": external_user.external_user_id,
            "username": external_user.username,
            "full_name": external_user.full_name,
            "email": external_user.email,
            "organization_id": external_user.organization_id,
            "client_id": external_user.client_id
        }
    }

@router.post("/external/register", response_model=auth_schema.Token)
def external_register(register_data: user_schema.ExternalUserRegister, db: Session = Depends(get_db)):
    # Verificar si el email ya existe
    if user_crud.get_external_user_by_email(db, register_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Verificar si el username ya existe
    if user_crud.get_external_user_by_username(db, register_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Verificar si la organización existe y está activa
    if register_data.organization_id:
        from app.models.organization_models import Organization
        organization = db.query(Organization).filter(
            Organization.organization_id == register_data.organization_id
        ).first()
        
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organización no encontrada"
            )
        
        if not organization.is_active or not organization.is_subscription_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="La organización no está activa o la suscripción ha expirado"
            )
    
    # Crear usuario externo
    external_user_data = user_schema.ExternalUserCreate(
        username=register_data.username,
        full_name=register_data.full_name,
        email=register_data.email,
        password=register_data.password,
        phone=register_data.phone,
        organization_id=register_data.organization_id,
        client_id=register_data.client_id
    )
    
    external_user = user_crud.create_external_user(db, external_user_data)
    
    # Crear token
    access_token_expires = timedelta(hours=24)
    access_token = user_crud.create_external_user_token(external_user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_at": external_user.expires_at,
        "external_user": {
            "external_user_id": external_user.external_user_id,
            "username": external_user.username,
            "full_name": external_user.full_name,
            "email": external_user.email,
            "organization_id": external_user.organization_id,
            "client_id": external_user.client_id
        }
    }

@router.get("/me", response_model=auth_schema.UserInfo)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/external/me", response_model=user_schema.ExternalUserOut)
def get_current_external_user_info(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    external_user = user_crud.verify_external_user_token(db, token)
    if not external_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return external_user

@router.post("/external/refresh", response_model=auth_schema.Token)
def refresh_external_token(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    external_user = user_crud.verify_external_user_token(db, token)
    if not external_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crear nuevo token
    new_token, expires_at = user_crud.create_external_user_token(external_user)
    
    return {
        "access_token": new_token,
        "token_type": "bearer",
        "expires_at": expires_at,
        "external_user": {
            "external_user_id": external_user.external_user_id,
            "username": external_user.username,
            "full_name": external_user.full_name,
            "email": external_user.email,
            "organization_id": external_user.organization_id,
            "client_id": external_user.client_id
        }
    }

@router.get("/subscription-info", response_model=dict)
def get_subscription_info(
    subscription_info: dict = Depends(get_organization_subscription_info)
):
    """
    Obtiene información detallada sobre la suscripción de la organización del usuario.
    Útil para mostrar advertencias y estado de la suscripción en el frontend.
    """
    return subscription_info

@router.get("/validate-subscription")
def validate_subscription(
    current_user: User = Depends(validate_organization_subscription)
):
    """
    Endpoint para validar que la suscripción esté activa.
    Si no está activa, lanza una excepción con el motivo.
    """
    return {
        "status": "active",
        "message": "Suscripción válida",
        "user_id": current_user.user_id,
        "organization_id": current_user.organization_id
    } 