from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: EmailStr
    role : str
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password_hash: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role : Optional[str] = None
    is_active: Optional[bool] = None
    password_hash: Optional[str] = None

class UserOut(UserBase):
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
