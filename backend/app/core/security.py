from datetime import datetime, timedelta, timezone
from typing import Optional, Annotated
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user_models import User
from app.models.organization_models import Organization
import logging

# Configuración de logging
logger = logging.getLogger(__name__)

# Configuración de seguridad
SECRET_KEY = "tu_clave_secreta_super_segura_cambiame_en_produccion"  # Cambia esto en producción
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 horas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña en texto plano coincide con el hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Genera un hash de la contraseña."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Crea un token JWT con los datos proporcionados."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Obtiene el usuario actual basado en el token JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Importar aquí para evitar importación circular
    from app.crud import user_crud
    user = user_crud.get_user_by_username(db, username)
    if user is None:
        raise credentials_exception
    return user 

async def get_current_external_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Obtiene el usuario externo actual basado en el token JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        user_type: str = payload.get("type")
        
        if user_id is None or user_type != "external":
            raise credentials_exception
            
        # Extraer el ID del usuario externo del formato "external_{id}"
        if not user_id.startswith("external_"):
            raise credentials_exception
            
        external_user_id = int(user_id.replace("external_", ""))
        
    except (JWTError, ValueError):
        raise credentials_exception
    
    # Importar aquí para evitar importación circular
    from app.crud import user_crud
    external_user = user_crud.get_external_user(db, external_user_id=external_user_id)
    if external_user is None:
        raise credentials_exception
    return external_user

async def get_current_user_organization(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db)
):
    """
    Obtiene el usuario actual y su organización.
    Lanza una excepción si el usuario no tiene una organización asignada.
    """
    user = await get_current_user(token, db)
    
    if not user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario no tiene una organización asignada"
        )
    
    return user 

async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def verify_external_user_token(db: Session, token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        external_user_id: int = payload.get("sub")
        if external_user_id is None:
            return None
        from app.models.user_models import ExternalUser
        external_user = db.query(ExternalUser).filter(ExternalUser.external_user_id == external_user_id).first()
        return external_user
    except JWTError:
        return None

async def validate_organization_subscription(
    current_user: Annotated[User, Depends(get_current_user_organization)],
    db: Session = Depends(get_db)
):
    """
    Valida que la organización del usuario tenga una suscripción activa.
    Esta función debe ser usada como dependencia en endpoints que requieren suscripción activa.
    """
    if current_user.role == 'super_user':
        # Los super usuarios siempre tienen acceso
        return current_user
    
    if not current_user.organization_id:
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
    
    # Verificar si la organización está activa
    if not organization.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La organización está inactiva. Contacta a soporte para más información."
        )
    
    # Verificar si la suscripción está activa
    if not organization.is_subscription_active:
        # Determinar el motivo del bloqueo
        if organization.subscription_status == 'suspended':
            reason = "La suscripción ha sido suspendida"
        elif organization.subscription_plan == 'free' and organization.trial_end_date and datetime.now(timezone.utc) > organization.trial_end_date:
            reason = "El período de prueba gratuita ha expirado"
        elif organization.subscription_end_date and datetime.now(timezone.utc) > organization.subscription_end_date:
            reason = "La suscripción ha expirado"
        else:
            reason = "Problema con la suscripción"
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Acceso bloqueado: {reason}. Contacta a soporte para renovar tu plan."
        )
    
    # Verificar advertencias de expiración
    if organization.should_show_trial_warning:
        logger.warning(f"Organización {organization.organization_id} tiene {organization.days_until_trial_expiry} días restantes de prueba")
    
    if organization.should_show_subscription_warning:
        logger.warning(f"Organización {organization.organization_id} tiene {organization.days_until_subscription_expiry} días restantes de suscripción")
    
    return current_user

async def get_organization_subscription_info(
    current_user: Annotated[User, Depends(get_current_user_organization)],
    db: Session = Depends(get_db)
):
    """
    Obtiene información detallada sobre la suscripción de la organización.
    Útil para mostrar advertencias en el frontend.
    """
    # Verificar que el usuario tenga una organización asignada
    if not current_user.organization_id:
        return None
    
    organization = db.query(Organization).filter(
        Organization.organization_id == current_user.organization_id
    ).first()
    
    if not organization:
        return None
    
    # Determinar el motivo del bloqueo si la suscripción no está activa
    reason = None
    if not organization.is_subscription_active:
        if organization.subscription_status == 'suspended':
            reason = "La suscripción ha sido suspendida"
        elif organization.subscription_plan == 'free' and organization.trial_end_date and datetime.now(timezone.utc) > organization.trial_end_date:
            reason = "El período de prueba gratuita ha expirado"
        elif organization.subscription_end_date and datetime.now(timezone.utc) > organization.subscription_end_date:
            reason = "La suscripción ha expirado"
        else:
            reason = "Problema con la suscripción"
    
    return {
        "organization_id": organization.organization_id,
        "organization_name": organization.name,
        "organization_active": organization.is_active,
        "organization_status": "active" if organization.is_active else "inactive",
        "subscription_plan": organization.subscription_plan,
        "subscription_status": organization.subscription_status,
        "is_subscription_active": organization.is_subscription_active,
        "trial_start_date": organization.trial_start_date,
        "trial_end_date": organization.trial_end_date,
        "subscription_start_date": organization.subscription_start_date,
        "subscription_end_date": organization.subscription_end_date,
        "days_until_trial_expiry": organization.days_until_trial_expiry,
        "days_until_subscription_expiry": organization.days_until_subscription_expiry,
        "should_show_trial_warning": organization.should_show_trial_warning,
        "should_show_subscription_warning": organization.should_show_subscription_warning,
        "max_users": organization.max_users,
        "current_users_count": len(organization.users) if organization.users else 0,
        "reason": reason
    }

def check_organization_access(organization_id: int, db: Session, user: User) -> bool:
    """
    Verifica si un usuario tiene acceso a una organización específica.
    """
    if user.role == 'super_user':
        return True
    
    if user.organization_id != organization_id:
        return False
    
    organization = db.query(Organization).filter(
        Organization.organization_id == organization_id
    ).first()
    
    if not organization or not organization.is_active or not organization.is_subscription_active:
        return False
    
    return True 