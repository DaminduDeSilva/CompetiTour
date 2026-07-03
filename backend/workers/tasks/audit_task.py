"""
Audit Task — Core Orchestrator
-------------------------------
This is the brain of the CompetiTour pricing audit pipeline.

For a given DMC package, it:
  1. Loads all itinerary components from the database
  2. For each hotel/excursion/transfer component:
       a. Scrapes Booking.com for that destination (geotargeted to source market)
       b. Scrapes Agoda in parallel
       c. Feeds both result sets to Gemini AI matcher to find the equivalent property
       d. Calculates the price delta (DMC price vs lowest OTA-matched price)
       e. Saves the match result to component_matches table
  3. Aggregates all component deltas into a CompetitivenessReport
  4. Saves the report to competitiveness_reports table

Usage:
    Can be called directly (for testing) or dispatched via the arq background worker.

    Direct:
        asyncio.run(run_audit(package_id=1, source_market="DE"))

    Via arq worker (once wired):
        await arq_pool.enqueue_job("run_audit", package_id=1, source_market="DE")

Exchange Rate:
    LKR → EUR conversion uses a configurable rate in .env (EXCHANGE_RATE_LKR_EUR).
    Default: 326.50 (approximate mid-2026 rate).
"""

import asyncio
import logging
import uuid
from datetime import datetime
from dataclasses import dataclass
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import async_session_factory as AsyncSessionLocal
from app.models.dmc_package import DMCPackage
from app.models.package_component import PackageComponent
from app.models.competitiveness_report import CompetitivenessReport
from app.models.component_match import ComponentMatch
from app.models.analysis_job import AnalysisJob
from app.config import get_settings

from scrapers.extractors.booking_scraper import BookingComScraper, HotelResult
from scrapers.extractors.agoda_scraper import AgodaScraper, AgodaHotelResult
from ai.matcher import ItineraryMatcher

logger = logging.getLogger(__name__)
settings = get_settings()

# LKR → EUR approximate exchange rate.
# Override via EXCHANGE_RATE_LKR_EUR in .env for precision.
EXCHANGE_RATE_LKR_EUR: float = getattr(settings, "EXCHANGE_RATE_LKR_EUR", 326.50)


@dataclass
class ComponentAuditResult:
    """The result of auditing a single package component against OTA sources."""
    component_id: int
    component_name: str
    dmc_price_eur: float
    matched_hotel_name: Optional[str]
    ota_price_eur: Optional[float]
    platform: Optional[str]
    confidence: float
    match_method: str
    price_delta_pct: Optional[float]    # negative = DMC is cheaper (leakage opportunity)
                                        # positive = DMC is more expensive (at risk)
    matched_url: Optional[str] = None


@dataclass 
class AuditSummary:
    """Aggregated audit result for the full package."""
    package_id: int
    source_market: str
    dmc_total_eur: float
    market_total_eur: float
    overall_delta_pct: float
    status: str                          # 'competitive' | 'at_risk' | 'margin_leakage'
    component_results: list[ComponentAuditResult]


def _lkr_to_eur(lkr: float) -> float:
    """Convert LKR to EUR using the configured exchange rate."""
    return round(lkr / EXCHANGE_RATE_LKR_EUR, 2)


def _determine_status(delta_pct: float) -> str:
    """
    Classify the competitiveness status based on price gap percentage.

    delta_pct is (dmc - market) / market * 100:
      < -5%   → margin_leakage  (DMC is too cheap, leaving money on table)
      -5% to 5% → competitive   (good positioning)
      > 5%    → at_risk         (DMC is more expensive than OTA assembly)
    """
    if delta_pct < -5.0:
        return "margin_leakage"
    elif delta_pct > 5.0:
        return "at_risk"
    else:
        return "competitive"


from datetime import date

async def _scrape_and_match_component(
    component: PackageComponent,
    source_market: str,
    locale: str,
    nights: int,
    matcher: ItineraryMatcher,
    checkin_date: Optional[date] = None,
) -> ComponentAuditResult:
    """
    Scrapes both Booking.com and Agoda for a single package component,
    runs AI matching, and returns the ComponentAuditResult.
    """
    component_name = component.name
    dmc_price_lkr = float(component.base_price_lkr or 0)
    dmc_price_eur = _lkr_to_eur(dmc_price_lkr)

    logger.info(f"[Audit] Processing component: '{component_name}' ({component.component_type})")

    # --- Step 1: Scrape OTA platforms sequentially ---
    booking_scraper = BookingComScraper(locale=locale, nights=nights, checkin_date=checkin_date)
    booking_results = None
    try:
        booking_results = await booking_scraper.scrape(component_name, max_results=10)
    except Exception as e:
        logger.warning(f"[Audit] Booking.com scrape failed for '{component_name}': {e}")
        booking_results = e

    agoda_scraper = AgodaScraper(locale=locale, nights=nights, checkin_date=checkin_date)
    agoda_results = None
    try:
        agoda_results = await agoda_scraper.scrape(component_name, max_results=10)
    except Exception as e:
        logger.warning(f"[Audit] Agoda scrape failed for '{component_name}': {e}")
        agoda_results = e

    # Flatten results, handle exceptions gracefully
    all_ota_results: list[HotelResult | AgodaHotelResult] = []
    if isinstance(booking_results, list):
        all_ota_results.extend(booking_results)
    else:
        logger.warning(f"[Audit] Booking.com scrape failed for '{component_name}': {booking_results}")

    if isinstance(agoda_results, list):
        all_ota_results.extend(agoda_results)
    else:
        logger.warning(f"[Audit] Agoda scrape failed for '{component_name}': {agoda_results}")

    if not all_ota_results:
        logger.warning(f"[Audit] No OTA results found for '{component_name}'. Skipping.")
        return ComponentAuditResult(
            component_id=component.id,
            component_name=component_name,
            dmc_price_eur=dmc_price_eur,
            matched_hotel_name=None,
            ota_price_eur=None,
            platform=None,
            confidence=0.0,
            match_method="no_results",
            price_delta_pct=None,
            matched_url=None,
        )

    # --- Step 2: AI Matching ---
    ota_names = [r.name for r in all_ota_results]
    match_result = matcher.match_hotels(component_name, ota_names)

    matched_name = match_result.get("matched_hotel")
    confidence = float(match_result.get("confidence", 0))

    if not matched_name:
        logger.warning(f"[Audit] No AI match found for '{component_name}' against OTA results.")
        return ComponentAuditResult(
            component_id=component.id,
            component_name=component_name,
            dmc_price_eur=dmc_price_eur,
            matched_hotel_name=None,
            ota_price_eur=None,
            platform=None,
            confidence=confidence,
            match_method="llm_verified",
            price_delta_pct=None,
            matched_url=None,
        )

    # --- Step 3: Find the price for the matched hotel ---
    matched_ota = next(
        (r for r in all_ota_results if r.name == matched_name),
        None
    )

    ota_price_eur = matched_ota.total_price if matched_ota else None
    platform = matched_ota.platform if matched_ota else None
    matched_url = getattr(matched_ota, "url", None) if matched_ota else None

    # --- Fallback: Scrape hotel detail page directly if price is missing ---
    if ota_price_eur is None and platform == "Booking.com" and matched_url:
        logger.info(f"[Audit] Matched hotel '{matched_name}' has no price on search list. Scraping detail page directly: {matched_url}")
        try:
            detail_price = await booking_scraper.scrape_detail_page(matched_url)
            if detail_price is not None:
                ota_price_eur = detail_price
                if matched_ota:
                    matched_ota.total_price = detail_price
                    matched_ota.price_per_night = round(detail_price / nights, 2)
                logger.info(f"[Audit] Detail page scrape success: €{ota_price_eur}")
        except Exception as e:
            logger.warning(f"[Audit] Failed to scrape detail page for '{matched_name}': {e}")

    # --- Step 4: Calculate price delta ---
    price_delta_pct = None
    if ota_price_eur and dmc_price_eur > 0:
        price_delta_pct = round(
            ((dmc_price_eur - ota_price_eur) / ota_price_eur) * 100, 2
        )

    logger.info(
        f"[Audit] '{component_name}' → matched '{matched_name}' on {platform} "
        f"(confidence: {confidence}%) | DMC: €{dmc_price_eur} vs OTA: €{ota_price_eur} "
        f"| Delta: {price_delta_pct}%"
    )

    return ComponentAuditResult(
        component_id=component.id,
        component_name=component_name,
        dmc_price_eur=dmc_price_eur,
        matched_hotel_name=matched_name,
        ota_price_eur=ota_price_eur,
        platform=platform,
        confidence=confidence,
        match_method="llm_verified",
        price_delta_pct=price_delta_pct,
        matched_url=matched_url,
    )


async def run_audit(
    package_id: int,
    source_market: str = "DE",
    locale: str = "de-DE",
    job_id: Optional[str] = None,
) -> AuditSummary:
    """
    Main audit entry point. Orchestrates the full pipeline for a package.

    Args:
        package_id:    The DMCPackage.id to audit.
        source_market: ISO 3166-1 alpha-2 market code (e.g., 'DE', 'GB', 'AU').
        locale:        Browser locale for geotargeted pricing (e.g., 'de-DE').
        job_id:        Optional analysis job ID to track progress.

    Returns:
        AuditSummary with all component results and overall delta.
    """
    logger.info(f"[Audit] ▶ Starting audit — package_id={package_id}, market={source_market}, job_id={job_id}")

    job_uuid = uuid.UUID(job_id) if job_id else None
    
    try:
        async with AsyncSessionLocal() as db:
            # Load the package with all components
            result = await db.execute(
                select(DMCPackage)
                .options(selectinload(DMCPackage.components))
                .where(DMCPackage.id == package_id)
            )
            package = result.scalar_one_or_none()

            if not package:
                raise ValueError(f"Package {package_id} not found.")

            if not package.components:
                raise ValueError(f"Package {package_id} has no components to audit.")

            logger.info(f"[Audit] Package: '{package.name}' | {len(package.components)} components")

            # Update job status to scraping
            job = None
            if job_uuid:
                job_result = await db.execute(
                    select(AnalysisJob).where(AnalysisJob.id == job_uuid)
                )
                job = job_result.scalar_one_or_none()
                if job:
                    job.status = "scraping"
                    job.total_tasks = len(package.components)
                    job.completed_tasks = 0
                    await db.commit()

            from datetime import timedelta
            # Calculate dynamic check-in date: Wednesday approximately 30 days in the future
            base_date = date.today() + timedelta(days=30)
            days_to_add = (2 - base_date.weekday()) % 7
            checkin_date = base_date + timedelta(days=days_to_add)

            matcher = ItineraryMatcher()
            component_results: list[ComponentAuditResult] = []
            
            best_results = []
            best_matched_count = -1
            best_checkin_date = checkin_date

            max_attempts = 3
            attempt = 1

            while attempt <= max_attempts:
                logger.info(f"[Audit] Attempt {attempt}/{max_attempts}: Checking availability for check-in: {checkin_date}")
                component_results = []

                # Process components sequentially to avoid proxy rate limiting
                for idx, component in enumerate(package.components):
                    # Determine nights from the component's nights_or_duration field
                    nights = 1
                    if component.nights_or_duration:
                        try:
                            nights = int(str(component.nights_or_duration).split()[0])
                        except (ValueError, IndexError):
                            nights = 1

                    result = await _scrape_and_match_component(
                        component=component,
                        source_market=source_market,
                        locale=locale,
                        nights=nights,
                        matcher=matcher,
                        checkin_date=checkin_date,
                    )
                    component_results.append(result)

                    if job:
                        # Refresh job session reference
                        job_result = await db.execute(
                            select(AnalysisJob).where(AnalysisJob.id == job_uuid)
                        )
                        job = job_result.scalar_one_or_none()
                        if job:
                            job.completed_tasks = idx + 1
                            if idx + 1 == len(package.components) and (attempt == max_attempts or not any(r.ota_price_eur is None for r in component_results)):
                                job.status = "matching"
                            await db.commit()

                # Calculate successfully matched hotel components count
                matched_count = sum(
                    1 for r in component_results 
                    if r.ota_price_eur is not None 
                    and next((c.component_type for c in package.components if c.id == r.component_id), None) == "hotel"
                )
                if matched_count > best_matched_count:
                    best_matched_count = matched_count
                    best_results = component_results
                    best_checkin_date = checkin_date

                # Check if any hotel component is sold out
                has_sold_out = False
                for r in component_results:
                    # Find component type in package components
                    comp_type = next((c.component_type for c in package.components if c.id == r.component_id), None)
                    if r.ota_price_eur is None and comp_type == "hotel":
                        has_sold_out = True
                        break

                if not has_sold_out:
                    logger.info(f"[Audit] Success! Found pricing for all hotel components on check-in date: {checkin_date}")
                    best_results = component_results
                    best_checkin_date = checkin_date
                    break
                elif attempt == max_attempts:
                    logger.warning(f"[Audit] Exceeded max attempts ({max_attempts}). Proceeding with best attempt check-in date: {best_checkin_date} (resolved {best_matched_count} hotel components)")
                    component_results = best_results
                    checkin_date = best_checkin_date
                    break
                else:
                    logger.info(f"[Audit] Attempt {attempt} had sold-out components. Shifting check-in date +7 days and retrying...")
                    checkin_date = checkin_date + timedelta(days=7)
                    attempt += 1

            if job:
                job_result = await db.execute(
                    select(AnalysisJob).where(AnalysisJob.id == job_uuid)
                )
                job = job_result.scalar_one_or_none()
                if job:
                    job.status = "reporting"
                    await db.commit()

            # Save individual component matches to DB
            for result in component_results:
                if result.matched_hotel_name and result.confidence > 70:
                    # Resolve source_market_id & platform_id
                    market_id_map = {"DE": 1, "GB": 2, "AU": 3}
                    src_mkt_id = market_id_map.get(source_market.upper(), 1)
                    
                    platform_id_map = {"Booking.com": 1, "Agoda": 2}
                    plat_id = platform_id_map.get(result.platform, 1)

                    from app.models.ota_listing import OTAListing
                    comp_type = next((c.component_type for c in package.components if c.id == result.component_id), "hotel")
                    ota_list_record = OTAListing(
                        platform_id=plat_id,
                        source_market_id=src_mkt_id,
                        component_type=comp_type,
                        raw_name=result.matched_hotel_name,
                        price=result.ota_price_eur,
                        currency="EUR",
                        price_usd=round(result.ota_price_eur * 1.08, 2) if result.ota_price_eur else None,
                        url=result.matched_url,
                    )
                    db.add(ota_list_record)
                    await db.flush()  # Populates ota_list_record.id

                    match_record = ComponentMatch(
                        package_component_id=result.component_id,
                        ota_listing_id=ota_list_record.id,
                        confidence=result.confidence,
                        match_method=result.match_method,
                        reviewed=False,
                    )
                    db.add(match_record)

            # --- Aggregate results ---
            matched_results = [r for r in component_results if r.ota_price_eur is not None]

            dmc_total_eur = sum(r.dmc_price_eur for r in component_results)
            market_total_eur = sum(r.ota_price_eur for r in matched_results if r.ota_price_eur)

            if dmc_total_eur > 0 and market_total_eur > 0:
                overall_delta_pct = round(
                    ((dmc_total_eur - market_total_eur) / market_total_eur) * 100, 2
                )
                status = _determine_status(overall_delta_pct)
                market_assembled_price_usd = round(market_total_eur * 1.08, 2)
            else:
                overall_delta_pct = None
                status = "partial"
                market_assembled_price_usd = None

            # Map source_market string code to ID
            market_id_map = {"DE": 1, "GB": 2, "AU": 3}
            src_mkt_id = market_id_map.get(source_market.upper(), 1)

            # --- Save CompetitivenessReport ---
            report = CompetitivenessReport(
                package_id=package_id,
                source_market_id=src_mkt_id,
                dmc_price_usd=round(dmc_total_eur * 1.08, 2),
                market_assembled_price_usd=market_assembled_price_usd,
                price_delta_pct=overall_delta_pct,
                status=status,
            )
            db.add(report)

            # --- Update DMCPackage status ---
            package.status = status

            if job:
                job_result = await db.execute(
                    select(AnalysisJob).where(AnalysisJob.id == job_uuid)
                )
                job = job_result.scalar_one_or_none()
                if job:
                    job.status = "done"
                    job.completed_at = datetime.utcnow()

            await db.commit()

            logger.info(
                f"[Audit] ✓ Complete — DMC: €{dmc_total_eur} | Market: €{market_total_eur} "
                f"| Delta: {overall_delta_pct}% | Status: {status}"
            )

            summary = AuditSummary(
                package_id=package_id,
                source_market=source_market,
                dmc_total_eur=dmc_total_eur,
                market_total_eur=market_total_eur,
                overall_delta_pct=overall_delta_pct,
                status=status,
                component_results=component_results,
            )

        return summary

    except Exception as e:
        logger.exception(f"[Audit] Audit failed for package {package_id}: {e}")
        if job_uuid:
            try:
                async with AsyncSessionLocal() as error_db:
                    job_result = await error_db.execute(
                        select(AnalysisJob).where(AnalysisJob.id == job_uuid)
                    )
                    job = job_result.scalar_one_or_none()
                    if job:
                        job.status = "failed"
                        job.error_log = str(e)
                        job.completed_at = datetime.utcnow()
                        await error_db.commit()
            except Exception as db_err:
                logger.error(f"[Audit] Failed to log audit error to DB: {db_err}")
        raise e


# ---------------------------------------------------------------------------
# ARQ worker wrapper — called by arq when job is dispatched
# ---------------------------------------------------------------------------
async def audit_package(ctx: dict, package_id: int, source_market: str = "DE"):
    """
    ARQ-compatible wrapper for run_audit().
    ctx is provided automatically by arq (contains redis pool, job_id, etc.)
    """
    logger.info(f"[Worker] Job received — audit_package(package_id={package_id}, market={source_market})")

    # Map market code to locale string
    locale_map = {
        "DE": "de-DE",
        "GB": "en-GB",
        "AU": "en-AU",
        "US": "en-US",
        "FR": "fr-FR",
        "JP": "ja-JP",
    }
    locale = locale_map.get(source_market.upper(), "de-DE")

    summary = await run_audit(package_id=package_id, source_market=source_market, locale=locale)

    return {
        "package_id": summary.package_id,
        "status": summary.status,
        "overall_delta_pct": summary.overall_delta_pct,
        "components_matched": len([r for r in summary.component_results if r.ota_price_eur]),
        "components_total": len(summary.component_results),
    }
