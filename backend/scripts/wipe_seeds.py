import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(
    DATABASE_URL,
    connect_args={"statement_cache_size": 0}
)

async def wipe_seed_data():
    async with engine.begin() as conn:
        print("Truncating seed tables...")
        await conn.execute(text("TRUNCATE TABLE source_markets RESTART IDENTITY CASCADE"))
        await conn.execute(text("TRUNCATE TABLE ota_platforms RESTART IDENTITY CASCADE"))
        print("Truncation complete. Next API startup will re-seed them.")

if __name__ == "__main__":
    asyncio.run(wipe_seed_data())
