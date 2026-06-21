"""OTA Platform model — travel platforms being monitored."""

from sqlalchemy import Column, Integer, String, JSON

from app.database import Base


class OTAPlatform(Base):
    __tablename__ = "ota_platforms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)                   # 'booking.com', 'agoda'
    base_url = Column(String, nullable=False)
    scrape_config = Column(JSON)                            # selectors, search params, quirks
