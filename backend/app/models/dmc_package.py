"""DMC Package model — travel packages submitted by DMCs."""

from sqlalchemy import Column, Integer, String, Numeric, DateTime, func
from sqlalchemy.orm import relationship

from app.database import Base


class DMCPackage(Base):
    __tablename__ = "dmc_packages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dmc_account_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    duration_days = Column(Integer, nullable=False)
    total_price_lkr = Column(Numeric(12, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="active")

    # Relationships
    components = relationship("PackageComponent", back_populates="package", cascade="all, delete-orphan")
    reports = relationship("CompetitivenessReport", back_populates="package")
