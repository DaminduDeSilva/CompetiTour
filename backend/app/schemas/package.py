from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ComponentCreate(BaseModel):
    component_type: str
    name: str
    location: Optional[str] = None
    nights_or_duration: Optional[str] = None
    base_price_lkr: float
    notes: Optional[str] = None
    meta_data: Optional[dict] = None

class ComponentUpdate(BaseModel):
    id: Optional[int] = None
    component_type: str
    name: str
    location: Optional[str] = None
    nights_or_duration: Optional[str] = None
    base_price_lkr: float
    notes: Optional[str] = None
    meta_data: Optional[dict] = None

class PackageCreate(BaseModel):
    name: str
    destination: str
    duration_days: int
    adults: Optional[int] = 2
    children: Optional[int] = 0
    rooms: Optional[int] = 1
    target_date: Optional[datetime] = None
    total_price_lkr: float
    components: List[ComponentCreate]

class PackageUpdate(BaseModel):
    name: Optional[str] = None
    destination: Optional[str] = None
    duration_days: Optional[int] = None
    adults: Optional[int] = None
    children: Optional[int] = None
    rooms: Optional[int] = None
    target_date: Optional[datetime] = None
    total_price_lkr: Optional[float] = None
    status: Optional[str] = None
    components: Optional[List[ComponentUpdate]] = None

class OTAListingResponse(BaseModel):
    id: int
    platform_id: Optional[int] = None
    source_market_id: Optional[int] = None
    component_type: str
    raw_name: str
    price: Optional[float] = None
    price_usd: Optional[float] = None
    currency: Optional[str] = None
    url: Optional[str] = None

    class Config:
        from_attributes = True

class ComponentMatchResponse(BaseModel):
    id: int
    package_component_id: int
    report_id: Optional[int] = None
    ota_listing_id: Optional[int] = None
    confidence: float
    match_method: str
    reviewed: bool
    listing: Optional[OTAListingResponse] = None

    class Config:
        from_attributes = True

class ComponentResponse(BaseModel):
    id: int
    package_id: int
    component_type: str
    name: str
    location: Optional[str] = None
    nights_or_duration: Optional[str] = None
    base_price_lkr: float
    notes: Optional[str] = None
    meta_data: Optional[dict] = None
    matches: List[ComponentMatchResponse] = []

    class Config:
        from_attributes = True

from uuid import UUID

class CompetitivenessReportResponse(BaseModel):
    id: int
    job_id: Optional[UUID] = None
    package_id: int
    source_market_id: Optional[int] = None
    dmc_price_usd: float
    market_assembled_price_usd: Optional[float] = None
    price_delta_pct: Optional[float] = None
    status: str
    generated_at: datetime
    matches: List[ComponentMatchResponse] = []

    class Config:
        from_attributes = True

class PackageResponse(BaseModel):
    id: int
    name: str
    destination: str
    duration_days: int
    adults: int
    children: int
    rooms: int
    target_date: Optional[datetime] = None
    total_price_lkr: float
    status: str
    components: List[ComponentResponse] = []
    reports: List[CompetitivenessReportResponse] = []

    class Config:
        from_attributes = True
