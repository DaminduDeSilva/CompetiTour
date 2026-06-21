"""Report schemas."""

from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from typing import Optional

class ComponentMatchResponse(BaseModel):
    id: int
    package_component_id: int
    ota_listing_id: int
    confidence: Optional[Decimal] = None
    match_method: Optional[str] = None
    reviewed: bool

    class Config:
        from_attributes = True

class CompetitivenessReportResponse(BaseModel):
    id: int
    package_id: int
    source_market_id: int
    dmc_price_usd: Optional[Decimal] = None
    market_assembled_price_usd: Optional[Decimal] = None
    price_delta_pct: Optional[Decimal] = None
    status: Optional[str] = None
    generated_at: datetime

    class Config:
        from_attributes = True
