"""Analysis job model — tracks async job status for frontend polling."""

import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, ARRAY

from app.database import Base


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    package_id = Column(Integer, ForeignKey("dmc_packages.id"))
    source_market_ids = Column(ARRAY(Integer), nullable=False)
    status = Column(String, default="queued")               # queued | scraping | matching | reporting | done | failed
    total_tasks = Column(Integer, default=0)
    completed_tasks = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    error_log = Column(String)
