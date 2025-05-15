from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class TicketBase(BaseModel):
    title: str
    description: str
    priority: str
    status: str
    category: str
    due_date: Optional[date] = None
    resolution_description: Optional[str] = None

class TicketCreate(TicketBase):
    ticket_number: str
    project_id: int
    client_id: int
    reported_by_user_id: int
    assigned_to_user_id: int

class TicketUpdate(TicketBase):
    status: Optional[str] = None
    resolution_description: Optional[str] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

class TicketOut(TicketBase):
    ticket_id: int
    ticket_number: str
    project_id: int
    client_id: int
    reported_by_user_id: int
    assigned_to_user_id: int
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

    class Config:
        orm_mode = True
