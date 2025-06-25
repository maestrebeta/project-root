from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime

class OrganizationBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    tax_id: Optional[str] = None
    country_code: Optional[str] = Field(None, max_length=2)
    timezone: str = 'UTC'
    subscription_plan: str = 'free'
    max_users: int = 5
    logo_url: Optional[str] = None
    primary_contact_email: Optional[EmailStr] = None
    primary_contact_name: Optional[str] = None
    primary_contact_phone: Optional[str] = None
    is_active: bool = True

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(OrganizationBase):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class OrganizationOut(OrganizationBase):
    organization_id: int
    created_at: datetime
    updated_at: datetime
    current_users_count: Optional[int] = 0

    # Validadores para manejar valores None desde la base de datos
    @validator('is_active', pre=True)
    def validate_is_active(cls, v):
        if v is None:
            return True
        return bool(v)
    
    @validator('timezone', pre=True)
    def validate_timezone(cls, v):
        if v is None:
            return 'UTC'
        return str(v)
    
    @validator('subscription_plan', pre=True)
    def validate_subscription_plan(cls, v):
        if v is None:
            return 'free'
        return str(v)
    
    @validator('max_users', pre=True)
    def validate_max_users(cls, v):
        if v is None:
            return 5
        return int(v)

    class Config:
        from_attributes = True

class OrganizationWithDetails(OrganizationOut):
    users_count: int = 0
    clients_count: int = 0
    projects_count: int = 0

# Schemas para calificaciones
class OrganizationRatingBase(BaseModel):
    rating: float  # 1-5 estrellas
    comment: Optional[str] = None
    is_anonymous: bool = False

class OrganizationRatingCreate(OrganizationRatingBase):
    organization_id: Optional[int] = None  # Opcional porque se pasa como parámetro separado
    client_id: int
    external_user_id: Optional[int] = None

class OrganizationRatingUpdate(OrganizationRatingBase):
    rating: Optional[float] = None
    is_anonymous: Optional[bool] = None

class OrganizationRatingOut(OrganizationRatingBase):
    rating_id: int
    organization_id: int
    external_user_id: Optional[int] = None
    client_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Schema para estadísticas de calificaciones
class OrganizationRatingStats(BaseModel):
    average_rating: float
    total_ratings: int
    rating_distribution: dict  # {1: count, 2: count, 3: count, 4: count, 5: count}
    recent_ratings: List[OrganizationRatingOut] 