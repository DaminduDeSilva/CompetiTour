from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import logging

from ai.embedder import EmbeddingService
from app.database import get_db
from app.models.dmc_package import DMCPackage
from app.models.package_component import PackageComponent
from app.models.component_match import ComponentMatch
from app.schemas.package import PackageCreate, PackageResponse
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)
embedding_service = EmbeddingService()

@router.post("/", response_model=PackageResponse)
async def create_package(
    package_data: PackageCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new DMC travel package along with its itinerary components."""
    
    new_package = DMCPackage(
        dmc_account_id=current_user.id,
        name=package_data.name,
        destination=package_data.destination,
        duration_days=package_data.duration_days,
        total_price_lkr=package_data.total_price_lkr,
        status="active"
    )
    
    db.add(new_package)
    await db.flush()  # To get the new_package.id
    
    # Create the components
    created_components = []
    for comp in package_data.components:
        new_comp = PackageComponent(
            package_id=new_package.id,
            component_type=comp.component_type,
            name=comp.name,
            nights_or_duration=comp.nights_or_duration,
            base_price_lkr=comp.base_price_lkr
        )
        db.add(new_comp)
        created_components.append(new_comp)

    await db.flush()

    if created_components:
        try:
            embeddings = embedding_service.embed([component.name for component in created_components])
        except Exception as e:
            logger.warning(f"Failed to embed package components for package {new_package.id}: {e}")
            embeddings = [None] * len(created_components)

        for idx, component in enumerate(created_components):
            component.embedding = embeddings[idx] if idx < len(embeddings) else None
        
    await db.commit()
    
    # Eagerly load the created package with relations to avoid lazy-loading MissingGreenlet error
    result = await db.execute(
        select(DMCPackage)
        .options(
            selectinload(DMCPackage.components)
            .selectinload(PackageComponent.matches)
            .selectinload(ComponentMatch.listing),
            selectinload(DMCPackage.reports),
        )
        .where(DMCPackage.id == new_package.id)
    )
    db_package = result.scalar_one()
    return db_package

from typing import List

@router.get("/", response_model=List[PackageResponse])
async def list_packages(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists all packages in the database for the current tenant."""
    result = await db.execute(
        select(DMCPackage)
        .options(
            selectinload(DMCPackage.components)
            .selectinload(PackageComponent.matches)
            .selectinload(ComponentMatch.listing),
            selectinload(DMCPackage.reports),
        )
        .where(DMCPackage.dmc_account_id == current_user.id)
    )
    packages = result.scalars().all()
    return packages

@router.get("/{package_id}", response_model=PackageResponse)
async def get_package(
    package_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches a specific package by ID for the current tenant, including its components."""
    result = await db.execute(
        select(DMCPackage)
        .options(
            selectinload(DMCPackage.components)
            .selectinload(PackageComponent.matches)
            .selectinload(ComponentMatch.listing),
            selectinload(DMCPackage.reports),
        )
        .where(DMCPackage.id == package_id)
        .where(DMCPackage.dmc_account_id == current_user.id)
    )
    package = result.scalar_one_or_none()
    
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
        
    return package

@router.delete("/{package_id}")
async def delete_package(
    package_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a specific package by ID for the current tenant."""
    result = await db.execute(
        select(DMCPackage)
        .options(
            selectinload(DMCPackage.components).selectinload(PackageComponent.matches),
            selectinload(DMCPackage.reports)
        )
        .where(DMCPackage.id == package_id)
        .where(DMCPackage.dmc_account_id == current_user.id)
    )
    package = result.scalar_one_or_none()
    
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
        
    await db.delete(package)
    await db.commit()
    return {"status": "success", "message": f"Package {package_id} successfully deleted"}

