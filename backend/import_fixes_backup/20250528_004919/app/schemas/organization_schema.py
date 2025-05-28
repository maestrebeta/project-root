from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    is_active: bool = True
    country_code: Optional[str] = Field(None, max_length=2)
    timezone: str = 'UTC'
    subscription_plan: str = 'free'
    max_users: int = 5
    logo_url: Optional[str] = None
    primary_contact_email: Optional[EmailStr] = None
    primary_contact_name: Optional[str] = None
    primary_contact_phone: Optional[str] = None

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(OrganizationBase):
    pass

class OrganizationOut(OrganizationBase):
    organization_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OrganizationWithDetails(OrganizationOut):
    users_count: int = 0
    clients_count: int = 0
    projects_count: int = 0 