from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class ClientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    code: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = True
    country_code: Optional[str] = Field(None, max_length=2)
    address: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=20)
    tax_id: Optional[str] = Field(None, max_length=50)
    organization_id: int


class ClientCreate(ClientBase):
    pass


class ClientUpdate(ClientBase):
    pass


class ClientOut(ClientBase):
    client_id: int
    created_at: datetime
    updated_at: datetime
    rating_average: Optional[float] = None

    class Config:
        from_attributes = True
