from pydantic import BaseModel, validator, Field, EmailStr, field_validator
from typing import Optional, List, Dict, Any
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
    username: str
    full_name: Optional[str] = None
    email: EmailStr
    role: str
    is_active: bool = True
    organization_id: Optional[int] = None
    country_code: Optional[str] = None
    timezone: str = 'UTC'
    language: str = 'es'
    specialization: Optional[str] = 'development'
    sub_specializations: Optional[List[str]] = None
    hourly_rate: Optional[int] = None
    weekly_capacity: Optional[int] = 40
    skills: Optional[Dict[str, Any]] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    organization_id: Optional[int] = None
    country_code: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    specialization: Optional[str] = None
    sub_specializations: Optional[List[str]] = None
    hourly_rate: Optional[int] = None
    weekly_capacity: Optional[int] = None
    skills: Optional[Dict[str, Any]] = None
    profile_image: Optional[str] = None
    theme_preferences: Optional[Dict[str, Any]] = None

# Esquema simplificado para identificar el problema
class UserOutSimple(BaseModel):
    user_id: int
    username: str
    full_name: Optional[str] = None
    email: str
    role: str
    is_active: bool
    organization_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserOut(UserBase):
    user_id: int
    profile_image: Optional[str] = None
    theme_preferences: Optional[Dict[str, Any]] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    # Remover temporalmente la relación organization para identificar el problema
    # organization: Optional[OrganizationInfo] = None

    class Config:
        from_attributes = True

# Schemas para usuarios externos
class ExternalUserBase(BaseModel):
    username: str
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    is_active: bool = True
    client_id: Optional[int] = None

class ExternalUserCreate(ExternalUserBase):
    password: str
    organization_id: int

class ExternalUserUpdate(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    client_id: Optional[int] = None

class ExternalUserStatusUpdate(BaseModel):
    is_active: bool

class ExternalUserOut(ExternalUserBase):
    external_user_id: int
    organization_id: int
    client_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class ExternalUserLogin(BaseModel):
    email: EmailStr
    password: str

class ExternalUserLoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: ExternalUserOut

# Schemas para autenticación externa
class ExternalUserRegister(BaseModel):
    username: str
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    organization_id: int
    client_id: Optional[int] = None

class ExternalUserSession(BaseModel):
    external_user_id: int
    username: str
    full_name: str
    email: EmailStr
    organization_id: int
    client_id: Optional[int] = None
    token: str
    expires_at: datetime
