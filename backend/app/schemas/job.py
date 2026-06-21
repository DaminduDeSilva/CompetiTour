"""Job schemas."""

from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class AnalysisJobCreate(BaseModel):
    source_market_ids: List[int]

class AnalysisJobResponse(BaseModel):
    id: UUID
    package_id: int
    source_market_ids: List[int]
    status: str
    total_tasks: int
    completed_tasks: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    error_log: Optional[str] = None

    class Config:
        from_attributes = True
