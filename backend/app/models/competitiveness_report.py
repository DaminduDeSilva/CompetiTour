"""Competitiveness report model — generated analysis reports."""

from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class CompetitivenessReport(Base):
    __tablename__ = "competitiveness_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(UUID(as_uuid=True), ForeignKey("analysis_jobs.id", ondelete="SET NULL"), nullable=True)
    package_id = Column(Integer, ForeignKey("dmc_packages.id", ondelete="CASCADE"))
    source_market_id = Column(Integer, ForeignKey("source_markets.id"))
    dmc_price_usd = Column(Numeric(12, 2))
    market_assembled_price_usd = Column(Numeric(12, 2))
    price_delta_pct = Column(Numeric(6, 2))
    status = Column(String)                                 # 'competitive' | 'at_risk' | 'margin_leakage' | 'underpriced'
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    package = relationship("DMCPackage", back_populates="reports")
    matches = relationship("ComponentMatch", backref="report", lazy="selectin", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_reports_package", "package_id", generated_at.desc()),
    )
