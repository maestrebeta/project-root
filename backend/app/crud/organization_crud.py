from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.organization_models import Organization, OrganizationRating
from app.models.user_models import User
from app.models.client_models import Client
from app.models.project_models import Project
from app.schemas.organization_schema import OrganizationCreate, OrganizationUpdate, OrganizationRatingCreate, OrganizationRatingUpdate
from typing import List, Optional

def create_organization(db: Session, organization: OrganizationCreate):
    db_organization = Organization(**organization.dict())
    db.add(db_organization)
    db.commit()
    db.refresh(db_organization)
    return db_organization

def get_organization(db: Session, organization_id: int):
    return db.query(Organization).filter(Organization.organization_id == organization_id).first()

def get_organization_by_name(db: Session, name: str):
    return db.query(Organization).filter(Organization.name == name).first()

def get_organizations(db: Session, skip: int = 0, limit: int = 100):
    """Obtener organizaciones con conteo de usuarios actuales"""
    organizations = db.query(Organization).offset(skip).limit(limit).all()
    
    # Agregar conteo de usuarios a cada organización
    for org in organizations:
        org.current_users_count = db.query(func.count(User.user_id)).filter(
            User.organization_id == org.organization_id,
            User.is_active == True
        ).scalar()
    
    return organizations

def update_organization(db: Session, organization_id: int, organization: OrganizationUpdate):
    db_organization = db.query(Organization).filter(Organization.organization_id == organization_id).first()
    if db_organization:
        update_data = organization.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_organization, key, value)
        db.commit()
        db.refresh(db_organization)
    return db_organization

def delete_organization(db: Session, organization_id: int):
    db_organization = db.query(Organization).filter(Organization.organization_id == organization_id).first()
    if db_organization:
        db.delete(db_organization)
        db.commit()
    return db_organization

def get_organization_details(db: Session, organization_id: int):
    organization = db.query(Organization).filter(Organization.organization_id == organization_id).first()
    if not organization:
        return None
    
    users_count = db.query(func.count(User.user_id)).filter(User.organization_id == organization_id).scalar()
    clients_count = db.query(func.count(Client.client_id)).filter(Client.organization_id == organization_id).scalar()
    projects_count = db.query(func.count(Project.project_id)).join(Client).filter(Client.organization_id == organization_id).scalar()
    
    return {
        **organization.__dict__,
        'users_count': users_count,
        'clients_count': clients_count,
        'projects_count': projects_count
    }

# CRUD para calificaciones de organización
def create_organization_rating(db: Session, organization_id: int, rating: OrganizationRatingCreate):
    # Excluir organization_id del esquema para evitar conflicto
    rating_data = rating.dict()
    rating_data.pop('organization_id', None)  # Remover si existe
    
    db_rating = OrganizationRating(
        **rating_data,
        organization_id=organization_id
    )
    db.add(db_rating)
    db.commit()
    db.refresh(db_rating)
    return db_rating

def get_organization_ratings(
    db: Session, 
    organization_id: int, 
    skip: int = 0, 
    limit: int = 100,
    client_id: Optional[int] = None
):
    query = db.query(OrganizationRating).filter(
        OrganizationRating.organization_id == organization_id
    )
    
    if client_id:
        query = query.filter(OrganizationRating.client_id == client_id)
    
    return query.offset(skip).limit(limit).all()

def get_organization_rating(db: Session, rating_id: int):
    return db.query(OrganizationRating).filter(OrganizationRating.rating_id == rating_id).first()

def update_organization_rating(db: Session, rating_id: int, rating: OrganizationRatingUpdate):
    db_rating = db.query(OrganizationRating).filter(OrganizationRating.rating_id == rating_id).first()
    if db_rating:
        update_data = rating.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_rating, key, value)
        db.commit()
        db.refresh(db_rating)
    return db_rating

def delete_organization_rating(db: Session, rating_id: int):
    db_rating = db.query(OrganizationRating).filter(OrganizationRating.rating_id == rating_id).first()
    if db_rating:
        db.delete(db_rating)
        db.commit()
    return db_rating

def get_organization_rating_stats(db: Session, organization_id: int, client_id: Optional[int] = None):
    """Obtener estadísticas de calificaciones de una organización"""
    query = db.query(OrganizationRating).filter(
        OrganizationRating.organization_id == organization_id
    )
    
    if client_id:
        query = query.filter(OrganizationRating.client_id == client_id)
    
    # Calcular promedio
    avg_rating = db.query(func.avg(OrganizationRating.rating)).filter(
        OrganizationRating.organization_id == organization_id
    ).scalar() or 0.0
    
    # Contar total
    total_ratings = query.count()
    
    # Distribución de calificaciones
    rating_distribution = {}
    for i in range(1, 6):
        count = db.query(OrganizationRating).filter(
            OrganizationRating.organization_id == organization_id,
            OrganizationRating.rating == i
        ).count()
        rating_distribution[i] = count
    
    # Calificaciones recientes
    recent_ratings = query.order_by(OrganizationRating.created_at.desc()).limit(5).all()
    
    return {
        "average_rating": round(float(avg_rating), 2),
        "total_ratings": total_ratings,
        "rating_distribution": rating_distribution,
        "recent_ratings": recent_ratings
    }

def check_user_has_rated(db: Session, organization_id: int, external_user_id: int, client_id: int):
    """Verificar si un usuario ya calificó a la organización para un cliente específico"""
    return db.query(OrganizationRating).filter(
        OrganizationRating.organization_id == organization_id,
        OrganizationRating.external_user_id == external_user_id,
        OrganizationRating.client_id == client_id
    ).first()

def get_user_rating(db: Session, organization_id: int, external_user_id: int, client_id: int):
    """Obtener la calificación existente de un usuario para un cliente específico"""
    return db.query(OrganizationRating).filter(
        OrganizationRating.organization_id == organization_id,
        OrganizationRating.external_user_id == external_user_id,
        OrganizationRating.client_id == client_id
    ).first()

def create_or_update_organization_rating(db: Session, organization_id: int, rating: OrganizationRatingCreate):
    """Crear o actualizar una calificación de organización"""
    # Verificar si ya existe una calificación del mismo usuario para el mismo cliente
    existing_rating = db.query(OrganizationRating).filter(
        OrganizationRating.organization_id == organization_id,
        OrganizationRating.external_user_id == rating.external_user_id,
        OrganizationRating.client_id == rating.client_id
    ).first()
    
    if existing_rating:
        # Actualizar calificación existente
        update_data = rating.dict(exclude_unset=True)
        # Excluir organization_id para evitar conflictos
        update_data.pop('organization_id', None)
        for key, value in update_data.items():
            setattr(existing_rating, key, value)
        db.commit()
        db.refresh(existing_rating)
        return existing_rating
    else:
        # Crear nueva calificación
        rating_data = rating.dict()
        rating_data.pop('organization_id', None)  # Remover si existe
        
        db_rating = OrganizationRating(
            **rating_data,
            organization_id=organization_id
        )
        db.add(db_rating)
        db.commit()
        db.refresh(db_rating)
        return db_rating 