"""Source market model — countries/regions being monitored."""

from sqlalchemy import Column, Integer, String

from app.database import Base


class SourceMarket(Base):
    __tablename__ = "source_markets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    country_code = Column(String(2), nullable=False)       # 'DE', 'GB'
    country_name = Column(String, nullable=False)
    currency = Column(String(3), nullable=False)            # 'EUR', 'GBP'
    locale = Column(String, nullable=False)                 # 'de-DE', 'en-GB'
    timezone = Column(String, nullable=False)               # 'Europe/Berlin'
