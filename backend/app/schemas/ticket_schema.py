from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List, Dict, Any

class TicketCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_active: bool = True
    default_title_template: Optional[str] = None
    default_description_template: Optional[str] = None
    default_priority: Optional[str] = None
    default_estimated_hours: Optional[int] = None

class TicketCategoryCreate(TicketCategoryBase):
    organization_id: int

class TicketCategoryUpdate(TicketCategoryBase):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class TicketCategoryOut(TicketCategoryBase):
    category_id: int
    organization_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TicketBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str
    status: str
    category: Optional[str] = None  # Campo legacy
    category_id: Optional[int] = None  # Nueva relación
    due_date: Optional[date] = None
    resolution_description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_name: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    estimated_hours: Optional[int] = None

class TicketCreate(TicketBase):
    ticket_number: str
    project_id: Optional[int] = None
    client_id: Optional[int] = None
    organization_id: int
    reported_by_user_id: Optional[int] = None
    assigned_to_user_id: Optional[int] = None

class TicketUpdate(TicketBase):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    category: Optional[str] = None
    category_id: Optional[int] = None
    due_date: Optional[date] = None
    resolution_description: Optional[str] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_name: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    estimated_hours: Optional[int] = None

# Esquema específico para actualizaciones de estado
class TicketStatusUpdate(BaseModel):
    status: str
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

class TicketOut(TicketBase):
    ticket_id: int
    ticket_number: str
    project_id: Optional[int] = None
    client_id: Optional[int] = None
    organization_id: int
    reported_by_user_id: Optional[int] = None
    assigned_to_user_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    category_rel: Optional[TicketCategoryOut] = None

    class Config:
        from_attributes = True
