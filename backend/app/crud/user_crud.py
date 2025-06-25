from sqlalchemy.orm import Session, joinedload
from app.models.user_models import User, ExternalUser
from app.models.organization_models import OrganizationRating
from app.schemas.user_schema import UserCreate, UserUpdate, ExternalUserCreate, ExternalUserUpdate, ExternalUserStatusUpdate
from app.schemas.organization_schema import OrganizationRatingCreate, OrganizationRatingUpdate
from passlib.context import CryptContext
import logging
from datetime import datetime, timedelta
import jwt
from app.core.security import SECRET_KEY, ALGORITHM

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurar el contexto de hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Genera un hash de la contraseña."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña en texto plano coincide con el hash."""
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db: Session, username: str, password: str):
    """Autentica un usuario verificando sus credenciales."""
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user

def get_user(db: Session, user_id: int):
    return db.query(User).options(joinedload(User.organization)).filter(User.user_id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).options(joinedload(User.organization)).offset(skip).limit(limit).all()

def get_users_by_organization(db: Session, organization_id: int, skip: int = 0, limit: int = 100):
    """
    Obtener usuarios de una organización específica
    """
    return (
        db.query(User)
        .options(joinedload(User.organization))
        .filter(User.organization_id == organization_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

def create_user(db: Session, user: UserCreate):
    try:
        # Hash de la contraseña
        hashed_password = get_password_hash(user.password)
        logger.info(f"Contraseña hasheada correctamente para el usuario {user.username}")
        
        # Crear el usuario
        db_user = User(
            username=user.username,
            full_name=user.full_name,
            email=user.email,
            role=user.role,
            password_hash=hashed_password,
            is_active=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        logger.info(f"Usuario {user.username} creado exitosamente")
        return db_user
    except Exception as e:
        logger.error(f"Error al crear usuario: {str(e)}")
        db.rollback()
        raise

def create_user_in_organization(db: Session, user: UserCreate, organization_id: int):
    """
    Crear un usuario en una organización específica
    """
    # Hash de la contraseña
    hashed_password = get_password_hash(user.password)
    logger.info(f"Contraseña hasheada correctamente para el usuario {user.username}")
    
    # Crear el usuario con la organización
    db_user = User(
        username=user.username,
        full_name=user.full_name,
        email=user.email,
        role=user.role,
        password_hash=hashed_password,
        is_active=True,
        organization_id=organization_id
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    logger.info(f"Usuario {user.username} creado exitosamente en la organización {organization_id}")
    return db_user

def update_user(db: Session, user_id: int, user: UserUpdate):
    try:
        db_user = get_user(db, user_id)
        if not db_user:
            return None
        
        logger.info(f"Actualizando usuario {user_id} con datos: {user.dict(exclude_unset=True)}")
        
        update_data = user.dict(exclude_unset=True)
        
        # Manejar password por separado
        if "password" in update_data:
            hashed_password = get_password_hash(update_data.pop("password"))
            setattr(db_user, "password_hash", hashed_password)
            logger.info("Password actualizado")
        
        # Manejar theme_preferences por separado
        if "theme_preferences" in update_data:
            theme_prefs = update_data.pop("theme_preferences")
            if hasattr(theme_prefs, 'dict'):
                theme_prefs = theme_prefs.dict()
            setattr(db_user, "theme_preferences", theme_prefs)
            logger.info("Theme preferences actualizado")
        
        # Actualizar todos los demás campos
        for key, value in update_data.items():
            setattr(db_user, key, value)
            logger.info(f"Campo {key} actualizado a: {value}")
        
        db.commit()
        db.refresh(db_user)
        
        logger.info(f"Usuario {user_id} actualizado exitosamente")
        return db_user
    except Exception as e:
        logger.error(f"Error al actualizar usuario: {str(e)}")
        db.rollback()
        raise

def delete_user(db: Session, user_id: int):
    try:
        db_user = get_user(db, user_id)
        if not db_user:
            return None
        db.delete(db_user)
        db.commit()
        return db_user
    except Exception as e:
        logger.error(f"Error al eliminar usuario: {str(e)}")
        db.rollback()
        raise

# CRUD para usuarios externos
def create_external_user(db: Session, external_user: ExternalUserCreate):
    hashed_password = get_password_hash(external_user.password)
    db_external_user = ExternalUser(
        username=external_user.username,
        full_name=external_user.full_name,
        email=external_user.email,
        phone=external_user.phone,
        hashed_password=hashed_password,
        organization_id=external_user.organization_id,
        is_active=True
    )
    db.add(db_external_user)
    db.commit()
    db.refresh(db_external_user)
    return db_external_user

def get_external_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(ExternalUser).offset(skip).limit(limit).all()

def get_external_users_by_organization(db: Session, organization_id: int, skip: int = 0, limit: int = 100):
    return db.query(ExternalUser).filter(
        ExternalUser.organization_id == organization_id
    ).offset(skip).limit(limit).all()

def get_external_user(db: Session, external_user_id: int):
    return db.query(ExternalUser).filter(ExternalUser.external_user_id == external_user_id).first()

def get_external_user_by_organization(db: Session, external_user_id: int, organization_id: int):
    return db.query(ExternalUser).filter(
        ExternalUser.external_user_id == external_user_id,
        ExternalUser.organization_id == organization_id
    ).first()

def get_external_user_by_email(db: Session, email: str):
    return db.query(ExternalUser).filter(ExternalUser.email == email).first()

def get_external_user_by_username(db: Session, username: str):
    return db.query(ExternalUser).filter(ExternalUser.username == username).first()

def check_external_user_exists(db: Session, email: str):
    user = db.query(ExternalUser).filter(ExternalUser.email == email).first()
    return {"exists": user is not None}

def update_external_user(db: Session, external_user_id: int, external_user: ExternalUserUpdate):
    db_external_user = db.query(ExternalUser).filter(ExternalUser.external_user_id == external_user_id).first()
    if db_external_user:
        update_data = external_user.dict(exclude_unset=True)
        
        # Si se está actualizando la contraseña, hashearla
        if "password" in update_data and update_data["password"]:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
        for key, value in update_data.items():
            if value is not None:
                setattr(db_external_user, key, value)
        
        db.commit()
        db.refresh(db_external_user)
    return db_external_user

def update_external_user_by_organization(db: Session, external_user_id: int, external_user: ExternalUserUpdate, organization_id: int):
    db_external_user = db.query(ExternalUser).filter(
        ExternalUser.external_user_id == external_user_id,
        ExternalUser.organization_id == organization_id
    ).first()
    if db_external_user:
        update_data = external_user.dict(exclude_unset=True)
        
        # Si se está actualizando la contraseña, hashearla
        if "password" in update_data and update_data["password"]:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        
        for key, value in update_data.items():
            if value is not None:
                setattr(db_external_user, key, value)
        
        db.commit()
        db.refresh(db_external_user)
    return db_external_user

def update_external_user_status(db: Session, external_user_id: int, status_update: ExternalUserStatusUpdate):
    db_external_user = db.query(ExternalUser).filter(ExternalUser.external_user_id == external_user_id).first()
    if db_external_user:
        db_external_user.is_active = status_update.is_active
        db_external_user.updated_at = datetime.now()
        db.commit()
        db.refresh(db_external_user)
    return db_external_user

def update_external_user_status_by_organization(db: Session, external_user_id: int, status_update: ExternalUserStatusUpdate, organization_id: int):
    db_external_user = db.query(ExternalUser).filter(
        ExternalUser.external_user_id == external_user_id,
        ExternalUser.organization_id == organization_id
    ).first()
    if db_external_user:
        db_external_user.is_active = status_update.is_active
        db_external_user.updated_at = datetime.now()
        db.commit()
        db.refresh(db_external_user)
    return db_external_user

def delete_external_user(db: Session, external_user_id: int):
    db_external_user = db.query(ExternalUser).filter(ExternalUser.external_user_id == external_user_id).first()
    if db_external_user:
        db.delete(db_external_user)
        db.commit()
    return db_external_user

def delete_external_user_by_organization(db: Session, external_user_id: int, organization_id: int):
    db_external_user = db.query(ExternalUser).filter(
        ExternalUser.external_user_id == external_user_id,
        ExternalUser.organization_id == organization_id
    ).first()
    if db_external_user:
        db.delete(db_external_user)
        db.commit()
    return db_external_user

def authenticate_external_user(db: Session, email: str, password: str):
    external_user = db.query(ExternalUser).filter(ExternalUser.email == email).first()
    if not external_user:
        return None
    if not external_user.hashed_password:
        return None
    if not verify_password(password, external_user.hashed_password):
        return None
    if not external_user.is_active:
        return None
    
    # Actualizar último login
    external_user.last_login = datetime.now()
    db.commit()
    db.refresh(external_user)
    
    return external_user

# CRUD para calificaciones de organización
def create_organization_rating(db: Session, rating: OrganizationRatingCreate):
    db_rating = OrganizationRating(**rating.dict())
    db.add(db_rating)
    db.commit()
    db.refresh(db_rating)
    return db_rating

def get_organization_ratings(db: Session, organization_id: int, skip: int = 0, limit: int = 100):
    return db.query(OrganizationRating).filter(
        OrganizationRating.organization_id == organization_id
    ).offset(skip).limit(limit).all()

def get_organization_rating(db: Session, rating_id: int):
    return db.query(OrganizationRating).filter(OrganizationRating.rating_id == rating_id).first()

def update_organization_rating(db: Session, rating_id: int, rating: OrganizationRatingUpdate):
    db_rating = db.query(OrganizationRating).filter(OrganizationRating.rating_id == rating_id).first()
    if db_rating:
        update_data = rating.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_rating, key, value)
        db_rating.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_rating)
    return db_rating

def delete_organization_rating(db: Session, rating_id: int):
    db_rating = db.query(OrganizationRating).filter(OrganizationRating.rating_id == rating_id).first()
    if db_rating:
        db.delete(db_rating)
        db.commit()
    return db_rating

def get_organization_rating_stats(db: Session, organization_id: int):
    """Obtener estadísticas de calificaciones de una organización"""
    ratings = db.query(OrganizationRating).filter(
        OrganizationRating.organization_id == organization_id
    ).all()
    
    if not ratings:
        return {
            "total_ratings": 0,
            "average_rating": 0,
            "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        }
    
    total_ratings = len(ratings)
    average_rating = sum(r.rating for r in ratings) / total_ratings
    
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for rating in ratings:
        rating_distribution[rating.rating] += 1
    
    return {
        "total_ratings": total_ratings,
        "average_rating": round(average_rating, 2),
        "rating_distribution": rating_distribution
    }

# Funciones de autenticación para usuarios externos
def create_external_user_token(external_user: ExternalUser):
    """Crear token JWT para usuario externo"""
    expires_delta = timedelta(days=30)  # Tokens más largos para usuarios externos
    expire = datetime.utcnow() + expires_delta
    
    to_encode = {
        "sub": str(external_user.external_user_id),
        "email": external_user.email,
        "username": external_user.username,
        "organization_id": external_user.organization_id,
        "type": "external_user",
        "exp": expire
    }
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, expire

def verify_external_user_token(db: Session, token: str):
    """Verificar token JWT de usuario externo"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        external_user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if external_user_id is None or token_type != "external_user":
            return None
            
        external_user = get_external_user(db, int(external_user_id))
        return external_user
    except jwt.PyJWTError:
        return None
