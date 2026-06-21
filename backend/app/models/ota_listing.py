"""OTA Listing model — scraped travel data from OTA platforms."""

from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Index, func

from app.database import Base


class OTAListing(Base):
    __tablename__ = "ota_listings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scrape_session_id = Column(Integer, ForeignKey("scrape_sessions.id"))
    platform_id = Column(Integer, ForeignKey("ota_platforms.id"))
    source_market_id = Column(Integer, ForeignKey("source_markets.id"))
    component_type = Column(String, nullable=False)         # 'hotel' | 'excursion'
    raw_name = Column(String, nullable=False)
    raw_description = Column(String)
    price = Column(Numeric(12, 2))
    currency = Column(String(3))
    price_usd = Column(Numeric(12, 2))                      # normalized for comparison
    url = Column(String)
    captured_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index("idx_ota_listings_captured", "captured_at"),
        Index("idx_ota_listings_market", "source_market_id", "platform_id"),
    )
