from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.schemas.ticket_schema import TicketCreate, TicketUpdate, TicketOut
from app.crud import ticket_crud
from app.core.database import get_db

router = APIRouter(prefix="/tickets", tags=["Tickets"])

@router.post("/", response_model=TicketOut)
def create_ticket(ticket: TicketCreate, db: Session = Depends(get_db)):
    return ticket_crud.create_ticket(db, ticket)

@router.get("/", response_model=List[TicketOut])
def read_tickets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return ticket_crud.get_tickets(db, skip, limit)

@router.get("/{ticket_id}", response_model=TicketOut)
def read_ticket(ticket_id: int, db: Session = Depends(get_db)):
    db_ticket = ticket_crud.get_ticket(db, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return db_ticket

@router.put("/{ticket_id}", response_model=TicketOut)
def update_ticket(ticket_id: int, ticket: TicketUpdate, db: Session = Depends(get_db)):
    db_ticket = ticket_crud.update_ticket(db, ticket_id, ticket)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return db_ticket

@router.delete("/{ticket_id}", response_model=TicketOut)
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    db_ticket = ticket_crud.delete_ticket(db, ticket_id)
    if not db_ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return db_ticket
