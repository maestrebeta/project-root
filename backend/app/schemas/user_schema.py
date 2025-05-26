from pydantic import BaseModel, validator, Field, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

class ThemePreferences(BaseModel):
    primary_color: str
    font_class: str
    font_size_class: str
    animations_enabled: bool

class OrganizationInfo(BaseModel):
    organization_id: Optional[int] = None
    name: Optional[str] = None

    @classmethod
    def from_orm(cls, obj):
        if obj is None:
            return None
        return cls(
            organization_id=obj.organization_id,
            name=obj.name
        )

class UserBase(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    email: EmailStr
    role: str = Field(
        ..., 
        description="Rol del usuario", 
        pattern="^(admin|dev|infra|super_user)$"
    )
    is_active: Optional[bool] = True
    profile_image: Optional[str] = None
    theme_preferences: Optional[ThemePreferences] = None
    organization_id: Optional[int] = None
    country_code: Optional[str] = None
    timezone: str = 'UTC'
    language: str = 'es'

    @validator('organization_id', pre=True, always=True)
    def set_default_organization(cls, v):
        # Si no se proporciona organization_id, devolver None
        # El backend decidirá qué hacer con este valor
        return v

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    profile_image: Optional[str] = None
    theme_preferences: Optional[ThemePreferences] = None
    organization_id: Optional[int] = None
    country_code: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None

class UserOut(BaseModel):
    user_id: int
    username: str
    full_name: Optional[str] = None
    email: str
    role: str
    is_active: bool
    profile_image: Optional[str] = None
    theme_preferences: Optional[dict] = None
    organization_id: Optional[int] = None
    organization: Optional[OrganizationInfo] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True

    @validator('organization', pre=True, always=True)
    def transform_organization(cls, v):
        # Si v es None, devolver None
        if v is None:
            return None
        
        # Si v es un modelo SQLAlchemy, usar el método from_orm
        if hasattr(v, 'organization_id'):
            return OrganizationInfo.from_orm(v)
        
        # Si ya es un diccionario, devolverlo
        return v

class UserWithOrganization(UserOut):
    organization_name: Optional[str] = None
