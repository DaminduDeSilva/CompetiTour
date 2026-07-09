from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.dmc_package import DMCPackage
from app.models.package_component import PackageComponent
from app.models.component_match import ComponentMatch
from app.schemas.package import PackageCreate, PackageUpdate, PackageResponse
from app.api.deps import get_current_user
from app.models.user import User
from pydantic import BaseModel
from app.services.pdf_report import generate_competitiveness_pdf

router = APIRouter()

class PDFReportRequest(BaseModel):
    package_name: str
    report_data: Dict[str, Any]
    components: List[Dict[str, Any]]

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
    for comp in package_data.components:
        new_comp = PackageComponent(
            package_id=new_package.id,
            component_type=comp.component_type,
            name=comp.name,
            nights_or_duration=comp.nights_or_duration,
            base_price_lkr=comp.base_price_lkr
        )
        db.add(new_comp)
        
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

@router.put("/{package_id}", response_model=PackageResponse)
async def update_package(
    package_id: int,
    package_data: PackageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates a specific package by ID for the current tenant."""
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
        
    update_data = package_data.model_dump(exclude_unset=True)
    components_data = update_data.pop("components", None)
    
    for key, value in update_data.items():
        setattr(package, key, value)
        
    if components_data is not None:
        existing_components = {c.id: c for c in package.components}
        components_to_keep = set()
        
        for comp_data in components_data:
            comp_id = comp_data.get("id")
            if comp_id and comp_id in existing_components:
                existing = existing_components[comp_id]
                for k, v in comp_data.items():
                    if k != "id":
                        setattr(existing, k, v)
                components_to_keep.add(comp_id)
            else:
                new_comp = PackageComponent(
                    package_id=package.id,
                    component_type=comp_data["component_type"],
                    name=comp_data["name"],
                    location=comp_data.get("location"),
                    nights_or_duration=comp_data.get("nights_or_duration"),
                    base_price_lkr=comp_data["base_price_lkr"],
                    notes=comp_data.get("notes")
                )
                db.add(new_comp)
                
        for comp_id, comp in existing_components.items():
            if comp_id not in components_to_keep:
                await db.delete(comp)
        
        
    await db.commit()
    
    # Re-fetch with eager loaded relationships to satisfy Pydantic serialization
    refresh_result = await db.execute(
        select(DMCPackage)
        .options(
            selectinload(DMCPackage.components)
            .selectinload(PackageComponent.matches)
            .selectinload(ComponentMatch.listing),
            selectinload(DMCPackage.reports),
        )
        .where(DMCPackage.id == package.id)
    )
    refreshed_package = refresh_result.scalar_one()
    
    return refreshed_package

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

@router.post("/reports/pdf")
async def export_pdf_report(
    request: PDFReportRequest,
    current_user: User = Depends(get_current_user)
):
    """Generates a PDF report based on the provided frontend snapshot data."""
    pdf_bytes = generate_competitiveness_pdf(
        package_name=request.package_name,
        report_data=request.report_data,
        components=request.components
    )
    
    # Sanitize package name for filename
    safe_name = "".join([c if c.isalnum() else "_" for c in request.package_name])
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="CompetiTour_Audit_{safe_name}.pdf"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

