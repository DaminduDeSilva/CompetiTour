import asyncio
from sqlalchemy import select
from app.database import async_session_factory
from app.models.user import User

async def main():
    async with async_session_factory() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"User: id={u.id}, email='{u.email}', tier='{u.subscription_tier}', audits_used={u.audits_used}")

if __name__ == "__main__":
    asyncio.run(main())
