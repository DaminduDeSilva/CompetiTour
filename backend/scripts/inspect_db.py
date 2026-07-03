import asyncio
from sqlalchemy import select
from app.database import async_session_factory
from app.models.dmc_package import DMCPackage
from app.models.package_component import PackageComponent

async def main():
    async with async_session_factory() as db:
        result = await db.execute(select(DMCPackage))
        packages = result.scalars().all()
        for p in packages:
            print(f"Package: {p.id} - {p.name} - Status: {p.status}")
            result_comp = await db.execute(select(PackageComponent).where(PackageComponent.package_id == p.id))
            components = result_comp.scalars().all()
            for c in components:
                print(f"  Component: {c.id} - {c.name} - Type: {c.component_type} - Duration: {c.nights_or_duration} - Price LKR: {c.base_price_lkr}")

if __name__ == "__main__":
    asyncio.run(main())
