from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid

from app.database import get_db
from app.models.user import User
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class UserUpdate(BaseModel):
    company_name: str | None = None
    full_name: str | None = None

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str | None = None
    company_name: str | None = None
    is_active: bool
    is_superuser: bool
    subscription_tier: str | None = "Professional"
    audits_used: int | None = 7
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[UserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")
    result = await db.execute(select(User))
    return result.scalars().all()

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    update_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if update_data.company_name is not None:
        current_user.company_name = update_data.company_name
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name
        
    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.post("/{user_id}/approve")
async def approve_user(
    user_id: uuid.UUID, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    await db.commit()
    return {"status": "approved"}
    
@router.get("/by-email/{email}", response_model=UserResponse)
async def get_user_by_email(email: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
