from sqlalchemy.orm import Session
from sqlalchemy import func
import secrets
from app.models.external_form_models import ExternalForm
from app.models.ticket_models import Ticket
from app.schemas.external_form_schema import ExternalFormCreate, ExternalFormUpdate

def generate_form_token():
    """Generar un token único para el formulario"""
    return secrets.token_urlsafe(32)

def create_external_form(db: Session, form: ExternalFormCreate, created_by_user_id: int):
    """Crear un nuevo formulario externo"""
    # Desactivar formularios existentes de la organización
    db.query(ExternalForm).filter(
        ExternalForm.organization_id == form.organization_id,
        ExternalForm.is_active == True
    ).update({"is_active": False})
    
    # Crear nuevo formulario
    db_form = ExternalForm(
        **form.dict(),
        created_by_user_id=created_by_user_id,
        form_token=generate_form_token()
    )
    db.add(db_form)
    db.commit()
    db.refresh(db_form)
    return db_form

def get_external_form_by_token(db: Session, form_token: str):
    """Obtener formulario por token"""
    return db.query(ExternalForm).filter(
        ExternalForm.form_token == form_token,
        ExternalForm.is_active == True
    ).first()

def get_external_form_by_organization(db: Session, organization_id: int):
    """Obtener formulario activo de una organización"""
    return db.query(ExternalForm).filter(
        ExternalForm.organization_id == organization_id,
        ExternalForm.is_active == True
    ).first()

def get_external_forms(db: Session, skip: int = 0, limit: int = 100):
    """Obtener todos los formularios externos"""
    return db.query(ExternalForm).offset(skip).limit(limit).all()

def update_external_form(db: Session, form_id: int, form: ExternalFormUpdate):
    """Actualizar formulario externo"""
    db_form = db.query(ExternalForm).filter(ExternalForm.form_id == form_id).first()
    if not db_form:
        return None
    
    for key, value in form.dict(exclude_unset=True).items():
        setattr(db_form, key, value)
    
    db.commit()
    db.refresh(db_form)
    return db_form

def delete_external_form(db: Session, form_id: int):
    """Eliminar formulario externo (desactivar)"""
    db_form = db.query(ExternalForm).filter(ExternalForm.form_id == form_id).first()
    if not db_form:
        return False
    
    db_form.is_active = False
    db.commit()
    return True

def get_external_form_details(db: Session, form_id: int):
    """Obtener detalles completos del formulario"""
    form = db.query(ExternalForm).filter(ExternalForm.form_id == form_id).first()
    if not form:
        return None
    
    # Contar tickets creados desde este formulario
    tickets_count = db.query(func.count(Ticket.ticket_id)).filter(
        Ticket.organization_id == form.organization_id
    ).scalar()
    
    return {
        **form.__dict__,
        'tickets_count': tickets_count
    } 