import logging
from datetime import timedelta
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.crud import user_crud
from app.schemas import auth_schema, user_schema
from app.core.security import create_access_token, verify_password, get_current_user
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

from app.core.security import get_current_user

@router.post("/login", response_model=auth_schema.LoginResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = user_crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Log para depuración
    print(f"Usuario autenticado: {user.username}")
    print(f"ID de organización: {user.organization_id}")
    print(f"Datos completos del usuario: {user.__dict__}")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "email": user.email, "role": user.role}, 
        expires_delta=access_token_expires
    )
    
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
    
    # Log para depuración
    print(f"UserInfo creado: {user_info.dict()}")
    
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
    
    # Actualizar último login
    user_crud.update_external_user_login(db, external_user.external_user_id)
    
    # Crear token
    token, expires_at = user_crud.create_external_user_token(external_user)
    
    return {
        "access_token": token,
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
    token, expires_at = user_crud.create_external_user_token(external_user)
    
    return {
        "access_token": token,
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