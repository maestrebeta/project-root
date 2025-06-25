from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ExternalFormBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    welcome_message: Optional[str] = None
    contact_email: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=50)
    is_active: bool = True

class ExternalFormCreate(ExternalFormBase):
    organization_id: int

class ExternalFormUpdate(ExternalFormBase):
    title: Optional[str] = Field(None, max_length=200)
    is_active: Optional[bool] = None

class ExternalFormOut(ExternalFormBase):
    form_id: int
    organization_id: int
    form_token: str
    created_by_user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ExternalFormWithDetails(ExternalFormOut):
    organization_name: Optional[str] = None
    created_by_user_name: Optional[str] = None
    tickets_count: int = 0 