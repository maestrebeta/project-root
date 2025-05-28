from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models.organization_models import Organization
from app.models.user_models import User
from app.models.client_models import Client
from app.models.project_models import Project
from app.schemas.organization_schema import OrganizationCreate, OrganizationUpdate

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
    return db.query(Organization).offset(skip).limit(limit).all()

def update_organization(db: Session, organization_id: int, organization: OrganizationUpdate):
    db_organization = db.query(Organization).filter(Organization.organization_id == organization_id).first()
    if not db_organization:
        return None
    
    for key, value in organization.dict(exclude_unset=True).items():
        setattr(db_organization, key, value)
    
    db.commit()
    db.refresh(db_organization)
    return db_organization

def delete_organization(db: Session, organization_id: int):
    db_organization = db.query(Organization).filter(Organization.organization_id == organization_id).first()
    if not db_organization:
        return False
    
    db.delete(db_organization)
    db.commit()
    return True

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