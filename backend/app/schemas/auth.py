"""Authentication schemas."""

from pydantic import BaseModel, EmailStr
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    company_name: str | None = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    company_name: str | None
    created_at: datetime
    is_active: int

    class Config:
        from_attributes = True
