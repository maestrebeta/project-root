from pydantic import BaseModel
from typing import Optional

class UserInfo(BaseModel):
    username: str
    full_name: Optional[str] = None
    email: str
    role: str
    organization_id: Optional[int] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserInfo

class TokenData(BaseModel):
    username: str | None = None

class LoginRequest(BaseModel):
    username: str
    password: str 