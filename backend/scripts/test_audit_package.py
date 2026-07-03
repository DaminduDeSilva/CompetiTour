import asyncio
import logging
from sqlalchemy import select
from app.database import async_session_factory as AsyncSessionLocal
from app.models.dmc_package import DMCPackage
from workers.tasks.audit_task import run_audit

async def main():
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(DMCPackage))
        packages = result.scalars().all()
        print("Available Packages:")
        target_package_id = None
        for p in packages:
            print(f"  ID: {p.id} | Name: '{p.name}' | Status: '{p.status}'")
            if "Colombo Beach" in p.name:
                target_package_id = p.id
                
        if not target_package_id:
            print("Colombo Beach package not found, using first package.")
            if packages:
                target_package_id = packages[0].id
                
        if target_package_id:
            print(f"\nRunning audit for Package ID: {target_package_id}")
            summary = await run_audit(package_id=target_package_id, source_market="DE")
            print("\nAudit complete! Summary results:")
            print(f"  Package ID: {summary.package_id}")
            print(f"  DMC Total: €{summary.dmc_total_eur}")
            print(f"  Market Total: €{summary.market_total_eur}")
            print(f"  Overall Delta: {summary.overall_delta_pct}%")
            print(f"  Status: {summary.status}")
            print("  Component Results:")
            for r in summary.component_results:
                print(f"    - {r.component_name} | Matched: {r.matched_hotel_name} | Price: €{r.ota_price_eur} | URL: {r.matched_url}")

if __name__ == "__main__":
    asyncio.run(main())
