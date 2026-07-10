import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.source_market import SourceMarket
from app.models.ota_platform import OTAPlatform
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, connect_args={"statement_cache_size": 0})
async_session_factory = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

async def seed():
    async with async_session_factory() as session:
        # Seed source markets
        session.add(SourceMarket(country_code="DE", country_name="Germany", currency="EUR", locale="de-DE", timezone="Europe/Berlin"))
        session.add(SourceMarket(country_code="GB", country_name="United Kingdom", currency="GBP", locale="en-GB", timezone="Europe/London"))
        session.add(SourceMarket(country_code="AU", country_name="Australia", currency="AUD", locale="en-AU", timezone="Australia/Sydney"))
        session.add(SourceMarket(country_code="FR", country_name="France", currency="EUR", locale="fr-FR", timezone="Europe/Paris"))
        session.add(SourceMarket(country_code="US", country_name="United States", currency="USD", locale="en-US", timezone="America/New_York"))
        session.add(SourceMarket(country_code="JP", country_name="Japan", currency="JPY", locale="ja-JP", timezone="Asia/Tokyo"))
        
        # Seed platforms
        session.add(OTAPlatform(name="Booking.com", base_url="https://www.booking.com", scrape_config={}))
        session.add(OTAPlatform(name="Agoda", base_url="https://www.agoda.com", scrape_config={}))
        
        await session.commit()
        print("Seeded database successfully.")

if __name__ == "__main__":
    asyncio.run(seed())
