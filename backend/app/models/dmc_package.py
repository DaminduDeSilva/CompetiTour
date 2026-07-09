"""DMC Package model — travel packages submitted by DMCs."""

from sqlalchemy import Column, Integer, String, Numeric, DateTime, func, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base

from sqlalchemy.dialects.postgresql import UUID

class DMCPackage(Base):
    __tablename__ = "dmc_packages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dmc_account_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    duration_days = Column(Integer, nullable=False)
    adults = Column(Integer, default=2)
    children = Column(Integer, default=0)
    rooms = Column(Integer, default=1)
    target_date = Column(DateTime(timezone=True), nullable=True)
    total_price_lkr = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="active")

    # Relationships
    components = relationship("PackageComponent", back_populates="package", cascade="all, delete-orphan")
    reports = relationship("CompetitivenessReport", back_populates="package", cascade="all, delete-orphan")
