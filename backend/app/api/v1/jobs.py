import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.dmc_package import DMCPackage
from app.models.analysis_job import AnalysisJob
from app.schemas.job import AnalysisJobResponse
from workers.tasks.audit_task import run_audit

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/run-audit/{package_id}", response_model=AnalysisJobResponse)
async def trigger_package_audit(
    package_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Triggers the competitor price audit for a specific package owned by the current tenant."""
    # Verify the package exists and belongs to the authenticated user
    result = await db.execute(
        select(DMCPackage)
        .where(DMCPackage.id == package_id)
        .where(DMCPackage.dmc_account_id == current_user.id)
    )
    package = result.scalar_one_or_none()
    
    if not package:
        raise HTTPException(status_code=404, detail="Package not found or access denied")
        
    # Create AnalysisJob record to track progress
    job = AnalysisJob(
        package_id=package_id,
        source_market_ids=[1],  # Default to DE (ID 1)
        status="queued",
        total_tasks=0,
        completed_tasks=0
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    logger.info(f"Queueing pricing audit for package {package.id} ('{package.name}') with Job ID {job.id}")
    background_tasks.add_task(run_audit, package_id=package.id, source_market="DE", job_id=str(job.id))
    
    return job

@router.get("/status/{job_id}", response_model=AnalysisJobResponse)
async def get_job_status(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves the status of a specific analysis job."""
    try:
        job_uuid = uuid.UUID(job_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid Job ID format")
        
    result = await db.execute(
        select(AnalysisJob).where(AnalysisJob.id == job_uuid)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return job

@router.get("/package/{package_id}/latest-job", response_model=Optional[AnalysisJobResponse])
async def get_latest_job_for_package(
    package_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves the latest analysis job for a specific package."""
    # Verify package ownership
    result_pkg = await db.execute(
        select(DMCPackage)
        .where(DMCPackage.id == package_id)
        .where(DMCPackage.dmc_account_id == current_user.id)
    )
    package = result_pkg.scalar_one_or_none()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found or access denied")
        
    result = await db.execute(
        select(AnalysisJob)
        .where(AnalysisJob.package_id == package_id)
        .order_by(AnalysisJob.created_at.desc())
        .limit(1)
    )
    job = result.scalar_one_or_none()
    return job
