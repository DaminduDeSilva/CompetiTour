import asyncio
from sqlalchemy import text
from app.database import engine, Base
from app.models import *

async def wipe_db():
    async with engine.begin() as conn:
        # Get all tables
        # Base.metadata doesn't automatically have all models unless imported,
        # but they should be if we imported app.models.*
        # Alternatively, we can just hardcode the tables to TRUNCATE or DELETE.
        tables_to_clear = [
            "component_matches",
            "competitiveness_reports",
            "analysis_jobs",
            "package_components",
            "dmc_packages",
        ]
        
        for table in tables_to_clear:
            try:
                await conn.execute(text(f'TRUNCATE TABLE "{table}" CASCADE;'))
                print(f"Truncated {table} (Postgres)")
            except Exception as e:
                try:
                    await conn.execute(text(f'DELETE FROM "{table}";'))
                    print(f"Deleted from {table} (SQLite/Fallback)")
                except Exception as e2:
                    print(f"Failed to clear {table}: {e2}")

asyncio.run(wipe_db())
