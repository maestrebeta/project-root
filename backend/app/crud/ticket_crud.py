from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.ticket_models import Ticket, TicketCategory
from app.schemas.ticket_schema import TicketCreate, TicketUpdate, TicketCategoryCreate, TicketCategoryUpdate
from datetime import datetime

def generate_ticket_number(db: Session, organization_id: int):
    """Genera un número único de ticket para la organización"""
    # Obtener el último ticket de la organización
    last_ticket = db.query(Ticket).filter(
        Ticket.organization_id == organization_id
    ).order_by(Ticket.ticket_id.desc()).first()
    
    # Generar número basado en el año actual y un contador
    current_year = datetime.now().year
    if last_ticket and last_ticket.ticket_number:
        # Intentar extraer el contador del último ticket
        try:
            parts = last_ticket.ticket_number.split('-')
            if len(parts) >= 3 and parts[1] == str(current_year):
                counter = int(parts[2]) + 1
            else:
                counter = 1
        except (ValueError, IndexError):
            counter = 1
    else:
        counter = 1
    
    return f"TKT-{current_year}-{counter:04d}"

# CRUD para categorías de tickets
def create_ticket_category(db: Session, category: TicketCategoryCreate):
    db_category = TicketCategory(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

def get_ticket_categories(db: Session, organization_id: int, skip: int = 0, limit: int = 100):
    return db.query(TicketCategory).filter(
        TicketCategory.organization_id == organization_id,
        TicketCategory.is_active == True
    ).offset(skip).limit(limit).all()

def get_ticket_category(db: Session, category_id: int):
    return db.query(TicketCategory).filter(TicketCategory.category_id == category_id).first()

def update_ticket_category(db: Session, category_id: int, category: TicketCategoryUpdate):
    db_category = db.query(TicketCategory).filter(TicketCategory.category_id == category_id).first()
    if db_category:
        update_data = category.dict(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:
                setattr(db_category, key, value)
        db.commit()
        db.refresh(db_category)
    return db_category

def delete_ticket_category(db: Session, category_id: int):
    db_category = db.query(TicketCategory).filter(TicketCategory.category_id == category_id).first()
    if db_category:
        db.delete(db_category)
        db.commit()
    return db_category

# CRUD para tickets (actualizado)
def create_ticket(db: Session, ticket: TicketCreate):
    # Generar número de ticket si no se proporciona
    if not ticket.ticket_number:
        ticket.ticket_number = generate_ticket_number(db, ticket.organization_id)
    
    # Crear el ticket
    ticket_data = ticket.dict()
    db_ticket = Ticket(**ticket_data)
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

def get_tickets(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    client_id: int = None,
    organization_id: int = None,
    status: str = None
):
    """Obtener tickets con filtros opcionales"""
    query = db.query(Ticket)
    
    # Aplicar filtros según los parámetros
    if client_id is not None:
        query = query.filter(Ticket.client_id == client_id)
    
    if organization_id is not None:
        query = query.filter(Ticket.organization_id == organization_id)
    
    if status is not None:
        query = query.filter(Ticket.status == status)
    
    results = query.offset(skip).limit(limit).all()
    
    return results

def get_ticket(db: Session, ticket_id: int):
    return db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()

def update_ticket(db: Session, ticket_id: int, ticket: TicketUpdate):
    db_ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if db_ticket:
        # Solo actualizar campos que no son None
        update_data = ticket.dict(exclude_unset=True)
        for key, value in update_data.items():
            if value is not None:  # Doble verificación para asegurar que no se actualicen campos None
                setattr(db_ticket, key, value)
        db.commit()
        db.refresh(db_ticket)
    return db_ticket

def delete_ticket(db: Session, ticket_id: int):
    db_ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if db_ticket:
        db.delete(db_ticket)
        db.commit()
    return db_ticket
