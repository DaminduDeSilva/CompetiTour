import asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
from app.models.user import User

async def main():
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL, connect_args={"statement_cache_size": 0})
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Check users
        user_res = await session.execute(select(User))
        users = user_res.scalars().all()
        print("=== Users ===")
        for u in users:
            print(f"ID: {u.id}, Email: {u.email}, Active: {u.is_active}, Company: {u.company_name}")

if __name__ == "__main__":
    asyncio.run(main())
