"""Scrape session model — audit trail of proxy-based scrape attempts."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func

from app.database import Base


class ScrapeSession(Base):
    __tablename__ = "scrape_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    platform_id = Column(Integer, ForeignKey("ota_platforms.id"))
    source_market_id = Column(Integer, ForeignKey("source_markets.id"))
    proxy_session_id = Column(String)                       # Torch Labs session id
    status = Column(String, default="pending")              # pending | running | success | blocked | error
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    error_log = Column(String)
