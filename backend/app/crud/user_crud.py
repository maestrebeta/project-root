from sqlalchemy.orm import Session, joinedload
from app.models.user_models import User
from app.schemas.user_schema import UserCreate, UserUpdate
from passlib.context import CryptContext
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurar el contexto de hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
        hashed_password = pwd_context.hash(user.password)
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
    hashed_password = pwd_context.hash(user.password)
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
        
        update_data = user.dict(exclude_unset=True)
        if "password" in update_data:
            hashed_password = pwd_context.hash(update_data.pop("password"))
            setattr(db_user, "password_hash", hashed_password)
        
        # Añadir actualización de organization_id
        if "organization_id" in update_data:
            setattr(db_user, "organization_id", update_data["organization_id"])
            logger.info(f"Actualizando organization_id a: {update_data['organization_id']}")
        
        for key, value in update_data.items():
            setattr(db_user, key, value)
        
        db.commit()
        db.refresh(db_user)
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
