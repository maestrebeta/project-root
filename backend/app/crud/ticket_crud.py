from sqlalchemy.orm import Session
from app.models.ticket_models import Ticket, TicketCategory
from app.schemas.ticket_schema import TicketCreate, TicketUpdate, TicketCategoryCreate, TicketCategoryUpdate

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

# CRUD para tickets (existente)
def create_ticket(db: Session, ticket: TicketCreate):
    db_ticket = Ticket(**ticket.dict())
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
    
    print(f"DEBUG: Getting tickets with filters - client_id: {client_id}, organization_id: {organization_id}, status: {status}")
    
    # Aplicar filtros según los parámetros
    if client_id is not None:
        query = query.filter(Ticket.client_id == client_id)
        print(f"DEBUG: Filtering by client_id: {client_id}")
    
    if organization_id is not None:
        query = query.filter(Ticket.organization_id == organization_id)
        print(f"DEBUG: Filtering by organization_id: {organization_id}")
    
    if status is not None:
        query = query.filter(Ticket.status == status)
        print(f"DEBUG: Filtering by status: {status}")
    
    results = query.offset(skip).limit(limit).all()
    print(f"DEBUG: Found {len(results)} tickets")
    
    for ticket in results:
        print(f"DEBUG: Ticket {ticket.ticket_id} - Status: {ticket.status}, Client: {ticket.client_id}")
    
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
