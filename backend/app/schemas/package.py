"""Package schemas."""

from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

class PackageComponentBase(BaseModel):
    component_type: str
    name: str
    location: Optional[str] = None
    nights_or_duration: Optional[str] = None
    base_price_lkr: Optional[Decimal] = None
    notes: Optional[str] = None

class PackageComponentCreate(PackageComponentBase):
    pass

class PackageComponentResponse(PackageComponentBase):
    id: int
    package_id: int

    class Config:
        from_attributes = True

class DMCPackageBase(BaseModel):
    name: str
    destination: str
    duration_days: int
    total_price_lkr: Decimal
    status: str = "active"

class DMCPackageCreate(DMCPackageBase):
    components: List[PackageComponentCreate] = []

class DMCPackageUpdate(BaseModel):
    name: Optional[str] = None
    destination: Optional[str] = None
    duration_days: Optional[int] = None
    total_price_lkr: Optional[Decimal] = None
    status: Optional[str] = None

class DMCPackageResponse(DMCPackageBase):
    id: int
    dmc_account_id: int
    created_at: datetime
    components: List[PackageComponentResponse] = []

    class Config:
        from_attributes = True
