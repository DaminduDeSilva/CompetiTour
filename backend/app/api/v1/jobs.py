import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from pydantic import BaseModel

from app.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.dmc_package import DMCPackage
from app.models.analysis_job import AnalysisJob
from app.models.package_component import PackageComponent
from app.schemas.job import AnalysisJobResponse
from workers.tasks.audit_task import run_audit
import asyncio

async def run_multi_audit_parallel(package_id: int, source_markets: List[str], job_id: str):
    """Runs multiple market audits in parallel to maximize proxy throughput."""
    tasks = [
        run_audit(package_id=package_id, source_market=market, job_id=job_id)
        for market in source_markets
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error(f"Parallel audit for market {source_markets[i]} failed: {result}")
            
    # Mark job as done
    from app.database import async_session_factory
    from datetime import datetime
    import uuid
    try:
        job_uuid = uuid.UUID(job_id)
        async with async_session_factory() as session:
            job_result = await session.execute(select(AnalysisJob).where(AnalysisJob.id == job_uuid))
            job = job_result.scalar_one_or_none()
            if job:
                job.status = "done"
                job.completed_at = datetime.utcnow()
                await session.commit()
    except Exception as e:
        logger.error(f"Failed to update job status to done: {e}")

class AuditRequest(BaseModel):
    source_markets: List[str]

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/run-audit/{package_id}", response_model=AnalysisJobResponse)
async def trigger_package_audit(
    package_id: int,
    request: AuditRequest,
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
        
    # Map string codes to IDs
    market_map = {"DE": 1, "GB": 2, "AU": 3, "FR": 4, "US": 5, "JP": 6}
    market_ids = [market_map.get(m, 1) for m in request.source_markets]
    
    result_components = await db.execute(
        select(func.count(PackageComponent.id))
        .where(PackageComponent.package_id == package_id)
    )
    component_count = result_components.scalar() or 0

    # Create AnalysisJob record to track progress
    job = AnalysisJob(
        package_id=package_id,
        source_market_ids=market_ids,
        status="queued",
        total_tasks=len(request.source_markets) * component_count,
        completed_tasks=0
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    logger.info(f"Queueing pricing audits for package {package.id} ('{package.name}') in markets {request.source_markets} with Job ID {job.id}")
    
    # Run in parallel since residential proxies are isolated per market
    background_tasks.add_task(run_multi_audit_parallel, package_id=package.id, source_markets=request.source_markets, job_id=str(job.id))
    
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
