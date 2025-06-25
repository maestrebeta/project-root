from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserInfo(BaseModel):
    user_id: int
    username: str
    full_name: Optional[str] = None
    email: str
    role: str
    organization_id: Optional[int] = None
    profile_image: Optional[str] = None
    theme_preferences: Optional[dict] = None
    last_login: Optional[datetime] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserInfo

class TokenData(BaseModel):
    username: Optional[str] = None

class ExternalToken(BaseModel):
    access_token: str
    token_type: str
    expires_at: datetime
    external_user: dict

class LoginRequest(BaseModel):
    username: str
    password: str 