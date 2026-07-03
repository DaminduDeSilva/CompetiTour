import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
from app.models.dmc_package import DMCPackage

async def main():
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL, connect_args={"statement_cache_size": 0})
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        pkg_res = await session.execute(select(DMCPackage))
        pkgs = pkg_res.scalars().all()
        print("=== Packages & Owners ===")
        for p in pkgs:
            print(f"ID: {p.id}, Name: {p.name}, Owner: {p.dmc_account_id}")

if __name__ == "__main__":
    asyncio.run(main())
