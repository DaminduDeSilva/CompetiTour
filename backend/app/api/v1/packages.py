"""Packages routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.database import get_db
from app.api.deps import get_current_user
from app.models.dmc_package import DMCPackage
from app.models.user import User
from app.schemas.package import DMCPackageCreate, DMCPackageResponse

router = APIRouter()

@router.get("/", response_model=List[DMCPackageResponse])
async def list_packages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    result = await db.execute(
        select(DMCPackage)
        .where(DMCPackage.dmc_account_id == current_user.id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()
