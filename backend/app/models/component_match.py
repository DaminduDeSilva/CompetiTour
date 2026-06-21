"""Component match model — AI-generated matches between DMC components and OTA listings."""

from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.database import Base


class ComponentMatch(Base):
    __tablename__ = "component_matches"

    id = Column(Integer, primary_key=True, autoincrement=True)
    package_component_id = Column(Integer, ForeignKey("package_components.id"))
    ota_listing_id = Column(Integer, ForeignKey("ota_listings.id"))
    confidence = Column(Numeric(5, 2))                      # 0-100
    match_method = Column(String)                           # 'embedding' | 'llm_verified' | 'manual'
    reviewed = Column(Boolean, default=False)

    # Relationships
    component = relationship("PackageComponent", back_populates="matches")

    __table_args__ = (
        Index("idx_component_matches_pkg", "package_component_id"),
    )
