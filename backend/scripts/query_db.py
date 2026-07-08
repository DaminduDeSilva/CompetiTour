import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
from app.models.ota_listing import OTAListing
from app.models.component_match import ComponentMatch
from app.models.competitiveness_report import CompetitivenessReport
from app.models.dmc_package import DMCPackage

async def main():
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL, connect_args={"statement_cache_size": 0})
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check packages
        pkg_res = await session.execute(select(DMCPackage))
        pkgs = pkg_res.scalars().all()
        print("=== Packages ===")
        for p in pkgs:
            print(f"ID: {p.id}, Name: {p.name}, Destination: {p.destination}, Price LKR: {p.total_price_lkr}")
            
        # Check listings
        listing_res = await session.execute(select(OTAListing))
        listings = listing_res.scalars().all()
        print("\n=== OTA Listings Scraped ===")
        for l in listings:
            print(f"ID: {l.id}, Session ID: {l.scrape_session_id}, Name: {l.raw_name}, Price: USD {l.price}, Platform: {l.platform_id}, URL: {l.url}")
            
        # Check matches
        match_res = await session.execute(select(ComponentMatch))
        matches = match_res.scalars().all()
        print("\n=== Component Matches ===")
        for m in matches:
            print(f"ID: {m.id}, Package Component ID: {m.package_component_id}, OTA Listing ID: {m.ota_listing_id}, Confidence: {m.confidence}%, Method: {m.match_method}")
            
        # Check reports
        report_res = await session.execute(select(CompetitivenessReport))
        reports = report_res.scalars().all()
        print("\n=== Competitiveness Reports ===")
        for r in reports:
            print(f"ID: {r.id}, Package ID: {r.package_id}, Market ID: {r.source_market_id}, DMC Price: {r.dmc_price_usd}, Market Price: {r.market_assembled_price_usd}, Delta: {r.price_delta_pct}%, Status: {r.status}")

if __name__ == "__main__":
    asyncio.run(main())
