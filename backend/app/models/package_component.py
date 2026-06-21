"""Package component model — hotels, transfers, excursions within a package."""

from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class PackageComponent(Base):
    __tablename__ = "package_components"

    id = Column(Integer, primary_key=True, autoincrement=True)
    package_id = Column(Integer, ForeignKey("dmc_packages.id", ondelete="CASCADE"), nullable=False)
    component_type = Column(String, nullable=False)         # 'hotel' | 'transfer' | 'excursion'
    name = Column(String, nullable=False)
    location = Column(String)
    nights_or_duration = Column(String)
    base_price_lkr = Column(Numeric(12, 2))
    notes = Column(String)

    # Relationships
    package = relationship("DMCPackage", back_populates="components")
    matches = relationship("ComponentMatch", back_populates="component")
