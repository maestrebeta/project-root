from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.organization_models import Organization, OrganizationRating
from app.models.user_models import User
from app.models.client_models import Client
from app.models.project_models import Project
from app.schemas.organization_schema import OrganizationCreate, OrganizationUpdate, OrganizationRatingCreate, OrganizationRatingUpdate
from typing import List, Optional
import random
import string
from app.core.security import get_password_hash
from datetime import datetime, timedelta

def generate_random_string(length=10):
    """Genera una cadena aleatoria de caracteres"""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def create_default_users_for_organization(db: Session, organization_id: int, organization_name: str):
    """Crea los 3 usuarios por defecto para una organización"""
    # Generar nombres de usuario únicos basados en la organización
    org_prefix = organization_name.lower().replace(' ', '').replace('.', '')[:10]
    
    # Super Usuario (CEO) - siempre el mismo para todas las organizaciones
    ceo_user = User(
        username=f"ceo_{org_prefix}",
        full_name=f"Super Administrador - {organization_name}",
        email=f"ceo@{organization_name.lower().replace(' ', '').replace('.', '')}.com",
        password_hash=get_password_hash("8164"),
        role='super_user',
        organization_id=organization_id,
        is_active=True,
        specialization='management',
        sub_specializations='["project_management", "team_lead"]',
        hourly_rate=100,
        weekly_capacity=40
    )
    db.add(ceo_user)
    
    # Administrador
    admin_password = generate_random_string(10)
    admin_user = User(
        username=f"admin_{org_prefix}",
        full_name=f"Administrador - {organization_name}",
        email=f"admin@{organization_name.lower().replace(' ', '').replace('.', '')}.com",
        password_hash=get_password_hash(admin_password),
        role='admin',
        organization_id=organization_id,
        is_active=True,
        specialization='management',
        sub_specializations='["project_management", "product_owner"]',
        hourly_rate=80,
        weekly_capacity=40
    )
    db.add(admin_user)
    
    # Desarrollador
    dev_password = generate_random_string(10)
    dev_user = User(
        username=f"dev_{org_prefix}",
        full_name=f"Desarrollador - {organization_name}",
        email=f"dev@{organization_name.lower().replace(' ', '').replace('.', '')}.com",
        password_hash=get_password_hash(dev_password),
        role='dev',
        organization_id=organization_id,
        is_active=True,
        specialization='development',
        sub_specializations='["backend", "frontend"]',
        hourly_rate=60,
        weekly_capacity=40
    )
    db.add(dev_user)
    
    # Commit para obtener los IDs
    db.commit()
    
    return {
        'ceo': {'username': f"ceo_{org_prefix}", 'password': '8164'},
        'admin': {'username': f"admin_{org_prefix}", 'password': admin_password},
        'dev': {'username': f"dev_{org_prefix}", 'password': dev_password}
    }

def calculate_subscription_dates(plan: str, start_date: datetime, duration_months: int = None):
    """Calcula las fechas de suscripción basadas en el plan y duración"""
    if plan == 'free':
        # Para prueba gratuita: 14 días desde la fecha de inicio
        trial_start = start_date or datetime.utcnow()
        trial_end = trial_start + timedelta(days=14)
        return {
            'trial_start_date': trial_start,
            'trial_end_date': trial_end,
            'subscription_start_date': None,
            'subscription_end_date': None,
            'subscription_status': 'trial'
        }
    else:
        # Para planes pagos: usar la duración especificada
        if not duration_months:
            duration_months = 1  # Por defecto 1 mes
        
        subscription_start = start_date or datetime.utcnow()
        # Calcular fecha de fin sumando meses
        subscription_end = subscription_start
        for _ in range(duration_months):
            # Avanzar un mes
            if subscription_end.month == 12:
                subscription_end = subscription_end.replace(year=subscription_end.year + 1, month=1)
            else:
                subscription_end = subscription_end.replace(month=subscription_end.month + 1)
        
        return {
            'trial_start_date': None,
            'trial_end_date': None,
            'subscription_start_date': subscription_start,
            'subscription_end_date': subscription_end,
            'subscription_status': 'active'
        }

def create_organization(db: Session, organization: OrganizationCreate):
    # Preparar datos de la organización
    org_data = organization.dict()
    
    # Calcular fechas de suscripción
    subscription_dates = calculate_subscription_dates(
        plan=org_data.get('subscription_plan', 'free'),
        start_date=org_data.get('subscription_start_date'),
        duration_months=org_data.get('subscription_duration_months')
    )
    
    # Actualizar datos con las fechas calculadas
    org_data.update(subscription_dates)
    
    # Si no se especificó duración para planes pagos, establecer por defecto
    if org_data.get('subscription_plan') != 'free' and not org_data.get('subscription_duration_months'):
        org_data['subscription_duration_months'] = 1
    
    # Crear la organización
    db_organization = Organization(**org_data)
    db.add(db_organization)
    db.commit()
    db.refresh(db_organization)
    
    # Crear usuarios por defecto para la nueva organización
    default_users = create_default_users_for_organization(db, db_organization.organization_id, db_organization.name)
    
    # Agregar información de usuarios creados al objeto de respuesta
    db_organization.default_users = default_users
    
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
        
        # Si se está cambiando el plan o la duración, recalcular fechas
        if 'subscription_plan' in update_data or 'subscription_duration_months' in update_data or 'subscription_start_date' in update_data:
            new_plan = update_data.get('subscription_plan', db_organization.subscription_plan)
            new_duration = update_data.get('subscription_duration_months', db_organization.subscription_duration_months)
            new_start_date = update_data.get('subscription_start_date', db_organization.subscription_start_date)
            
            # Calcular nuevas fechas
            subscription_dates = calculate_subscription_dates(
                plan=new_plan,
                start_date=new_start_date,
                duration_months=new_duration
            )
            
            # Actualizar con las nuevas fechas
            update_data.update(subscription_dates)
        
        # Aplicar todos los cambios
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

def get_organization_super_users(db: Session, organization_id: int):
    """Obtener los super usuarios de una organización"""
    super_users = db.query(User).filter(
        User.organization_id == organization_id,
        User.role == 'super_user',
        User.is_active == True
    ).all()
    
    # Convertir a diccionario con información básica
    super_users_info = []
    for user in super_users:
        super_users_info.append({
            'user_id': user.user_id,
            'username': user.username,
            'full_name': user.full_name,
            'email': user.email,
            'role': user.role,
            'is_active': user.is_active,
            'created_at': user.created_at
        })
    
    return super_users_info

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