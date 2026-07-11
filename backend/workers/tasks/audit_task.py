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
    LKR → USD conversion uses a configurable rate in .env (EXCHANGE_RATE_LKR_USD).
    Default: 333.33 (approximate mid-2026 rate).
"""

import asyncio
import logging
import uuid
from datetime import datetime, timedelta, date
from dataclasses import dataclass
from typing import Optional, Union, List

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
from scrapers.extractors.viator_scraper import ViatorScraper
from ai.matcher import ItineraryMatcher

import time
import httpx

logger = logging.getLogger(__name__)
settings = get_settings()

import os
import json

_cached_rates = {}
_rates_fetch_time = 0
CACHE_FILE = "/tmp/competitour_exchange_rates.json"

async def get_exchange_rates() -> dict:
    global _cached_rates, _rates_fetch_time
    now = time.time()
    if _cached_rates and (now - _rates_fetch_time < 3600):
        return _cached_rates

    try:
        async with httpx.AsyncClient() as client:
            res = await client.get("https://open.er-api.com/v6/latest/USD", timeout=5.0)
            if res.status_code == 200:
                _cached_rates = res.json()["rates"]
                _rates_fetch_time = now
                # Persist to disk for robust fallback
                with open(CACHE_FILE, "w") as f:
                    json.dump(_cached_rates, f)
                logger.info(f"[Currency] Fetched live exchange rates and updated disk cache.")
                return _cached_rates
    except Exception as e:
        logger.warning(f"[Currency] Failed to fetch live rates: {e}")

    # Fallback 1: Read from persistent disk cache
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r") as f:
                logger.info("[Currency] Using daily disk-cached exchange rates fallback.")
                return json.load(f)
        except Exception:
            pass

    # Fallback 2: Hardcoded safety net
    _cached_rates = {"LKR": getattr(settings, "EXCHANGE_RATE_LKR_USD", 333.33), "EUR": 0.88, "GBP": 0.75, "JPY": 160.0}
    return _cached_rates


@dataclass
class ComponentAuditResult:
    """The result of auditing a single package component against OTA sources."""
    component_id: int
    component_name: str
    dmc_price_usd: float
    matched_hotel_name: Optional[str]
    ota_price_usd: Optional[float]
    platform: Optional[str]
    confidence: float
    match_method: str
    price_delta_pct: Optional[float]    # negative = DMC is cheaper (leakage opportunity)
                                        # positive = DMC is more expensive (at risk)
    match_tier: str = "exact"
    matched_url: Optional[str] = None
    ota_price_local: Optional[float] = None
    ota_currency: Optional[str] = None


@dataclass 
class AuditSummary:
    """Aggregated audit result for the full package."""
    package_id: int
    source_market: str
    dmc_total_usd: float
    market_total_usd: float
    overall_delta_pct: float
    status: str                          # 'competitive' | 'at_risk' | 'margin_leakage'
    component_results: list[ComponentAuditResult]





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

def _clamp_delta(delta: float) -> float:
    """Clamps percentage to prevent DB NUMERIC(6, 2) overflow."""
    if delta > 9999.99: return 9999.99
    if delta < -9999.99: return -9999.99
    return delta


async def _scrape_and_match_component(
    component: PackageComponent,
    source_market: str,
    locale: str,
    nights: int,
    matcher: ItineraryMatcher,
    exchange_rates: dict,
    checkin_date: Optional[date] = None,
    adults: int = 2,
    children: int = 0,
    rooms: int = 1,
) -> Union[ComponentAuditResult, List[ComponentAuditResult]]:
    """
    Scrapes both Booking.com and Agoda for a single package component,
    runs AI matching, and returns the ComponentAuditResult.
    """
    component_name = component.name
    dmc_price_lkr = float(component.base_price_lkr or 0)
    rate_lkr = float(exchange_rates.get("LKR", 333.33))
    dmc_price_usd = round(dmc_price_lkr / rate_lkr, 2)

    logger.info(f"[Audit] Processing component: '{component_name}' ({component.component_type})")

    currency_map = {
        "DE": "EUR", "GB": "GBP", "AU": "AUD",
        "FR": "EUR", "US": "USD", "JP": "JPY"
    }
    target_currency = currency_map.get(source_market.upper(), "USD")

    # --- Step 1: Scrape OTA platforms based on component type ---
    all_ota_results: list[HotelResult | AgodaHotelResult] = []

    if component.component_type == "excursion":
        viator_scraper = ViatorScraper(target_currency="USD")
        try:
            viator_results = await viator_scraper.scrape(component_name, max_results=10)
            if isinstance(viator_results, list):
                all_ota_results.extend(viator_results)
        except Exception as e:
            logger.warning(f"[Audit] Viator scrape failed for '{component_name}': {e}")

        if not all_ota_results:
            logger.warning(f"[Audit] No OTA results found for excursion '{component_name}'.")
            return [ComponentAuditResult(
                component_id=component.id,
                component_name=component_name,
                dmc_price_usd=dmc_price_usd,
                matched_hotel_name=None,
                ota_price_usd=None,
                platform=None,
                confidence=0.0,
                match_method="no_results",
                price_delta_pct=None,
                match_tier="unmatched",
                matched_url=None,
                ota_price_local=None,
                ota_currency=None,
            )]

        # Calculate similarity score for each result using the synchronous fallback matcher
        valid_options = []
        for r in all_ota_results:
            match_info = matcher._fallback_match(component_name, [r.name])
            score = float(match_info.get("confidence", 0.0))
            valid_options.append((r, score))

        # Sort by score descending
        valid_options.sort(key=lambda x: x[1], reverse=True)
        top_options = valid_options[:3]

        results = []
        for r, score in top_options:
            ota_price_local = r.total_price
            ota_currency = getattr(r, "currency", "USD") or "USD"
            if ota_price_local is not None:
                rate_target = float(exchange_rates.get(ota_currency.upper(), 1.0))
                ota_price_usd = round(float(ota_price_local) / rate_target, 2)
            else:
                ota_price_usd = None

            results.append(ComponentAuditResult(
                component_id=component.id,
                component_name=component_name,
                dmc_price_usd=dmc_price_usd,
                matched_hotel_name=r.name,
                ota_price_usd=ota_price_usd,
                platform=r.platform,
                confidence=score,
                match_method="reference_match",
                price_delta_pct=None,
                match_tier="reference",
                matched_url=getattr(r, "url", None),
                ota_price_local=ota_price_local,
                ota_currency=ota_currency,
            ))
        
        logger.info(f"[Audit] Excursion '{component_name}' processed, returning {len(results)} reference results.")
        return results

    elif component.component_type == "transfer":
        route = ""
        format_val = ""
        vehicle_type = ""
        if isinstance(component.meta_data, dict):
            route = component.meta_data.get("route", "")
            format_val = component.meta_data.get("format", "")
            vehicle_type = component.meta_data.get("vehicle_type", "")
        
        # Build query parts
        query_parts = []
        if route:
            query_parts.append(route)
        else:
            query_parts.append(component_name)
            
        if format_val:
            query_parts.append(format_val)
        if vehicle_type:
            query_parts.append(vehicle_type)
            
        query_parts.append("transfer")
        search_query = " ".join(query_parts)

        viator_scraper = ViatorScraper(target_currency="USD")
        try:
            viator_results = await viator_scraper.scrape(search_query, max_results=10)
            if isinstance(viator_results, list):
                all_ota_results.extend(viator_results)
        except Exception as e:
            logger.warning(f"[Audit] Viator scrape failed for transfer '{search_query}': {e}")

        if not all_ota_results:
            logger.warning(f"[Audit] No OTA results found for transfer '{search_query}'.")
            return [ComponentAuditResult(
                component_id=component.id,
                component_name=component_name,
                dmc_price_usd=dmc_price_usd,
                matched_hotel_name=None,
                ota_price_usd=None,
                platform=None,
                confidence=0.0,
                match_method="no_results",
                price_delta_pct=None,
                match_tier="unmatched",
                matched_url=None,
                ota_price_local=None,
                ota_currency=None,
            )]

        # Calculate similarity score for each result using the synchronous fallback matcher against search_query
        valid_options = []
        for r in all_ota_results:
            match_info = matcher._fallback_match(search_query, [r.name])
            score = float(match_info.get("confidence", 0.0))
            valid_options.append((r, score))

        # Sort by score descending
        valid_options.sort(key=lambda x: x[1], reverse=True)
        top_options = valid_options[:3]

        results = []
        for r, score in top_options:
            ota_price_local = r.total_price
            ota_currency = getattr(r, "currency", "USD") or "USD"
            if ota_price_local is not None:
                rate_target = float(exchange_rates.get(ota_currency.upper(), 1.0))
                ota_price_usd = round(float(ota_price_local) / rate_target, 2)
            else:
                ota_price_usd = None

            results.append(ComponentAuditResult(
                component_id=component.id,
                component_name=component_name,
                dmc_price_usd=dmc_price_usd,
                matched_hotel_name=r.name,
                ota_price_usd=ota_price_usd,
                platform=r.platform,
                confidence=score,
                match_method="reference_match",
                price_delta_pct=None,
                match_tier="reference",
                matched_url=getattr(r, "url", None),
                ota_price_local=ota_price_local,
                ota_currency=ota_currency,
            ))
        
        logger.info(f"[Audit] Transfer '{component_name}' (query: '{search_query}') processed, returning {len(results)} reference results.")
        return results

    else:
        # Default to hotels (Booking/Agoda)
        booking_scraper = BookingComScraper(
            locale=locale, nights=nights, checkin_date=checkin_date, target_currency=target_currency,
            adults=adults, children=children, rooms=rooms
        )
        try:
            booking_results = await booking_scraper.scrape(component_name, max_results=15)
            if isinstance(booking_results, list):
                all_ota_results.extend(booking_results)
        except Exception as e:
            logger.warning(f"[Audit] Booking.com scrape failed for '{component_name}': {e}")

    if not all_ota_results:
        logger.warning(f"[Audit] No OTA results found for '{component_name}'.")
        matched_name = None
        confidence = 0.0
        match_tier = "unmatched"
    else:
        # --- Step 2: AI Matching ---
        ota_names = [r.name for r in all_ota_results]
        
        if component.component_type == "excursion":
            # For excursions, we pass the type to influence the prompt
            match_result = matcher.match_hotels(component_name, ota_names, component_type="excursion", meta_data=component.meta_data)
        else:
            match_result = matcher.match_hotels(component_name, ota_names, meta_data=component.meta_data)

        matched_name = match_result.get("matched_hotel")
        confidence = float(match_result.get("confidence", 0))
        match_tier = match_result.get("match_tier", "exact")

    if not matched_name and component.component_type == "hotel":
        if all_ota_results:
            logger.warning(f"[Audit] No AI match found for '{component_name}' against OTA results. Proceeding to UK Fallback URL Discovery.")
        
        # --- Fallback: UK URL Discovery ---
        # If the property is completely missing in the target locale (e.g. Japan), search via UK to extract the direct URL
        # We use a date 6 months in the future to guarantee the hotel is not sold out and appears in search results.
        future_checkin = date.today() + timedelta(days=180)
        fallback_scraper = BookingComScraper(
            locale="en-GB", nights=nights, checkin_date=future_checkin,
            target_currency="GBP", adults=adults, children=children, rooms=rooms
        )
        try:
            logger.info(f"[Audit] Initiating UK Fallback URL Discovery for '{component_name}'...")
            fallback_results = await asyncio.wait_for(
                fallback_scraper.scrape(component_name, max_results=10),
                timeout=45.0
            )
            if fallback_results:
                fallback_match = matcher.match_hotels(component_name, [r.name for r in fallback_results], meta_data=component.meta_data)
                fb_matched_name = fallback_match.get("matched_hotel")
                if fb_matched_name:
                    fb_ota = next((r for r in fallback_results if r.name == fb_matched_name), None)
                    if fb_ota and fb_ota.url:
                        logger.info(f"[Audit] Fallback URL Discovery SUCCESS! Found URL: {fb_ota.url}")
                        # Use the ORIGINAL TARGET MARKET SCRAPER to hit the detail page directly!
                        try:
                            # Strip query parameters so the target scraper uses its own checkin_date, not the 6-month future date!
                            clean_fallback_url = fb_ota.url.split("?")[0]
                            logger.info(f"[Audit] Scraping detail page directly using target market proxy: {clean_fallback_url}")
                            detail_price = await booking_scraper.scrape_detail_page(clean_fallback_url)
                            if detail_price is not None:
                                # We successfully bypassed the search ranking issue!
                                ota_price_local = detail_price
                                
                                # Convert native scraped currency to USD for internal comparison
                                rate_target = float(exchange_rates.get(target_currency, 1.0))
                                ota_price_usd = round(float(ota_price_local) / rate_target, 2)
                                
                                price_delta_pct = None
                                if ota_price_usd and dmc_price_usd > 0:
                                    raw_delta = round(((dmc_price_usd - ota_price_usd) / ota_price_usd) * 100, 2)
                                    price_delta_pct = _clamp_delta(raw_delta)
                                
                                logger.info(f"[Audit] Fallback Detail page scrape success: ${ota_price_usd}")
                                return ComponentAuditResult(
                                    component_id=component.id,
                                    component_name=component_name,
                                    dmc_price_usd=dmc_price_usd,
                                    matched_hotel_name=fb_matched_name,
                                    ota_price_usd=ota_price_usd,
                                    platform="Booking.com",
                                    confidence=float(fallback_match.get("confidence", 0)),
                                    match_method="llm_verified",
                                    price_delta_pct=price_delta_pct,
                                    match_tier=fallback_match.get("match_tier", "exact"),
                                    matched_url=fb_ota.url,
                                    ota_price_local=ota_price_local,
                                    ota_currency=target_currency,
                                )
                        except Exception as e:
                            logger.warning(f"[Audit] Failed to scrape fallback detail page for '{fb_matched_name}': {e}")
        except Exception as e:
            logger.warning(f"[Audit] Fallback URL Discovery failed: {e}")

    if not matched_name:
        # If fallback also failed, return empty
        return ComponentAuditResult(
            component_id=component.id,
            component_name=component_name,
            dmc_price_usd=dmc_price_usd,
            matched_hotel_name=None,
            ota_price_usd=None,
            platform=None,
            confidence=confidence,
            match_method="llm_verified" if matched_name else "no_results",
            price_delta_pct=None,
            match_tier=match_tier if matched_name else "unmatched",
            matched_url=None,
            ota_price_local=None,
            ota_currency=None,
        )

    # --- Step 3: Find the price for the matched hotel ---
    matched_ota = next(
        (r for r in all_ota_results if r.name == matched_name),
        None
    )

    ota_price_local = matched_ota.total_price if matched_ota else None
    
    # Convert native scraped currency to USD for internal comparison
    scraped_currency = target_currency
    if matched_ota:
        scraped_currency = getattr(matched_ota, "currency", target_currency) or target_currency

    if ota_price_local is not None:
        rate_target = float(exchange_rates.get(scraped_currency.upper(), 1.0))
        # Note: ER-API base is USD. So 1 USD = rate_target (e.g. 150 JPY, 0.85 EUR).
        # To convert local price to USD, we divide by the rate: local / rate_target.
        ota_price_usd = round(float(ota_price_local) / rate_target, 2)
    else:
        ota_price_usd = None
        
    platform = matched_ota.platform if matched_ota else None
    matched_url = getattr(matched_ota, "url", None) if matched_ota else None

    # --- Fallback: Scrape hotel detail page directly if price is missing ---
    if ota_price_usd is None and platform == "Booking.com" and matched_url:
        logger.info(f"[Audit] Matched hotel '{matched_name}' has no price on search list. Scraping detail page directly: {matched_url}")
        try:
            detail_price = await booking_scraper.scrape_detail_page(matched_url)
            if detail_price is not None:
                # detail_price is in target_currency, so we must convert to USD
                rate_target = float(exchange_rates.get(target_currency, 1.0))
                converted_usd = round(float(detail_price) / rate_target, 2)
                ota_price_usd = converted_usd
                ota_price_local = detail_price
                if matched_ota:
                    matched_ota.total_price = detail_price
                    matched_ota.price_per_night = round(detail_price / nights, 2)
                logger.info(f"[Audit] Detail page scrape success: {detail_price} {target_currency} -> ${ota_price_usd} USD")
        except Exception as e:
            logger.warning(f"[Audit] Failed to scrape detail page for '{matched_name}': {e}")

    # --- Step 4: Calculate price delta ---
    price_delta_pct = None
    if ota_price_usd and dmc_price_usd > 0:
        raw_delta = round(
            ((dmc_price_usd - ota_price_usd) / ota_price_usd) * 100, 2
        )
        price_delta_pct = _clamp_delta(raw_delta)

    logger.info(
        f"[Audit] '{component_name}' → matched '{matched_name}' on {platform} "
        f"(confidence: {confidence}%) | DMC: ${dmc_price_usd} vs OTA: ${ota_price_usd} "
        f"| Delta: {price_delta_pct}%"
    )

    return ComponentAuditResult(
        component_id=component.id,
        component_name=component_name,
        dmc_price_usd=dmc_price_usd,
        matched_hotel_name=matched_name,
        ota_price_usd=ota_price_usd,
        platform=platform,
        confidence=confidence,
        match_method="llm_verified",
        price_delta_pct=price_delta_pct,
        match_tier=match_tier,
        matched_url=matched_url,
        ota_price_local=ota_price_local,
        ota_currency=scraped_currency if ota_price_local else None,
    )


async def run_audit(
    package_id: int,
    source_market: str = "DE",
    locale: Optional[str] = None,
    job_id: Optional[str] = None,
    component_ids: Optional[list[int]] = None,
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
    if locale is None:
        market_locale_map = {
            "DE": "de-DE",
            "GB": "en-GB",
            "AU": "en-AU",
            "FR": "fr-FR",
            "US": "en-US",
            "JP": "ja-JP"
        }
        locale = market_locale_map.get(source_market.upper(), "en-US")

    logger.info(f"[Audit] ▶ Starting audit — package_id={package_id}, market={source_market}, locale={locale}, job_id={job_id}")

    exchange_rates = await get_exchange_rates()
    exchange_rate_lkr = float(exchange_rates.get("LKR", 333.33))
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

            # IMPORTANT: Do NOT mutate package.components — it has cascade="all, delete-orphan"
            # which means removing items from the ORM collection will DELETE them from the DB on commit.
            # Use a separate local list for auditing instead.
            if component_ids is not None:
                components_to_audit = [c for c in package.components if c.id in component_ids]
            else:
                components_to_audit = list(package.components)

            if not components_to_audit:
                raise ValueError(f"Package {package_id} has no valid components to audit based on selection.")

            logger.info(f"[Audit] Package: '{package.name}' | Auditing {len(components_to_audit)} / {len(package.components)} components")

            # Update job status to scraping
            job = None
            if job_uuid:
                job_result = await db.execute(
                    select(AnalysisJob).where(AnalysisJob.id == job_uuid)
                )
                job = job_result.scalar_one_or_none()
                if job:
                    if job.status != "scraping":
                        job.status = "scraping"
                        await db.commit()

            # Calculate dynamic check-in date or use target_date
            if getattr(package, "target_date", None):
                base_date = package.target_date.date()
                checkin_date = base_date
            else:
                base_date = date.today() + timedelta(days=30)
                days_to_add = (2 - base_date.weekday()) % 7
                checkin_date = base_date + timedelta(days=days_to_add)

            # Get occupancy from package (fallback to defaults if not set for older records)
            adults = getattr(package, "adults", 2) or 2
            children = getattr(package, "children", 0) or 0
            rooms = getattr(package, "rooms", 1) or 1

            matcher = ItineraryMatcher()
            component_results: list[ComponentAuditResult] = []
            
            best_results = []
            best_matched_count = -1
            best_checkin_date = checkin_date

            max_attempts = 1
            attempt = 1

            while attempt <= max_attempts:
                logger.info(f"[Audit] Attempt {attempt}/{max_attempts}: Checking availability for check-in: {checkin_date}")
                component_results = []

                # Process components in parallel
                scrape_tasks = []
                for idx, component in enumerate(components_to_audit):
                    # Determine nights from the component's nights_or_duration field
                    nights = 1
                    if component.nights_or_duration:
                        try:
                            nights = int(str(component.nights_or_duration).split()[0])
                        except (ValueError, IndexError):
                            nights = 1

                    # Get component-specific occupancy if available, otherwise fall back to package level
                    comp_adults = adults
                    comp_children = children
                    comp_rooms = rooms
                    if component.component_type == "hotel" and isinstance(component.meta_data, dict):
                        comp_adults = component.meta_data.get("adults", adults) or adults
                        comp_children = component.meta_data.get("children", children) or children
                        comp_rooms = component.meta_data.get("rooms", rooms) or rooms

                    if job:
                        job_result = await db.execute(
                            select(AnalysisJob).where(AnalysisJob.id == job_uuid)
                        )
                        job = job_result.scalar_one_or_none()
                        if job:
                            job.current_detail = f"Scraping components via {source_market} proxies..."
                            await db.commit()

                    scrape_tasks.append(_scrape_and_match_component(
                        component=component,
                        source_market=source_market,
                        locale=locale,
                        nights=nights,
                        matcher=matcher,
                        exchange_rates=exchange_rates,
                        checkin_date=checkin_date,
                        adults=comp_adults,
                        children=comp_children,
                        rooms=comp_rooms,
                    ))

                # Execute all component scrapers concurrently
                raw_component_results = await asyncio.gather(*scrape_tasks)
                component_results = []
                for r in raw_component_results:
                    if isinstance(r, list):
                        component_results.extend(r)
                    else:
                        component_results.append(r)

                if job:
                    from sqlalchemy import update
                    try:
                        await db.execute(
                            update(AnalysisJob)
                            .where(AnalysisJob.id == job_uuid)
                            .values(completed_tasks=AnalysisJob.completed_tasks + len(scrape_tasks))
                        )
                        await db.commit()
                    except Exception as e:
                        logger.error(f"[Audit] Failed to update progress: {e}")

                # Calculate successfully matched hotel components count
                matched_count = sum(
                    1 for r in component_results 
                    if r.ota_price_usd is not None 
                    and next((c.component_type for c in components_to_audit if c.id == r.component_id), None) == "hotel"
                )
                if matched_count > best_matched_count:
                    best_matched_count = matched_count
                    best_results = component_results
                    best_checkin_date = checkin_date

                # Check if any hotel component is sold out
                has_sold_out = False
                for r in component_results:
                    # Find component type in package components
                    comp_type = next((c.component_type for c in components_to_audit if c.id == r.component_id), None)
                    if r.ota_price_usd is None and comp_type == "hotel":
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

            # --- Aggregate results ---
            # Exclude excursions from main comparison (only include hotels with match_tier == "exact")
            matched_results = []
            for r in component_results:
                comp_type = next((c.component_type for c in components_to_audit if c.id == r.component_id), None)
                if r.ota_price_usd is not None and r.match_tier == "exact" and comp_type == "hotel":
                    matched_results.append(r)

            # Store the full DMC package price for reporting purposes (deduplicating to avoid double counting)
            unique_comp_prices = {r.component_id: r.dmc_price_usd for r in component_results}
            dmc_total_usd = sum(unique_comp_prices.values())
            
            # Use ONLY matched, non-alternative components for apples-to-apples variance calculation
            dmc_matched_total_usd = sum(r.dmc_price_usd for r in matched_results)
            market_total_usd = sum(r.ota_price_usd for r in matched_results)

            if dmc_matched_total_usd > 0 and market_total_usd > 0:
                raw_delta = round(
                    ((dmc_matched_total_usd - market_total_usd) / market_total_usd) * 100, 2
                )
                overall_delta_pct = _clamp_delta(raw_delta)
                status = _determine_status(overall_delta_pct)
                market_assembled_price_usd = market_total_usd
            else:
                overall_delta_pct = None
                status = "partial"
                market_assembled_price_usd = None

            # Map source_market string code to ID
            market_id_map = {"DE": 1, "GB": 2, "AU": 3, "FR": 4, "US": 5, "JP": 6}
            src_mkt_id = market_id_map.get(source_market.upper(), 1)

            # --- Save CompetitivenessReport ---
            report = CompetitivenessReport(
                job_id=job_uuid,
                package_id=package_id,
                source_market_id=src_mkt_id,
                dmc_price_usd=dmc_total_usd,
                market_assembled_price_usd=market_assembled_price_usd,
                price_delta_pct=overall_delta_pct,
                status=status,
            )
            db.add(report)
            await db.flush()  # Populates report.id

            # Save individual component matches to DB and link to report
            for result in component_results:
                if result.matched_hotel_name and (result.confidence >= 40 or result.match_tier == "reference"):
                    # Resolve source_market_id & platform_id dynamically
                    from app.models.source_market import SourceMarket
                    from app.models.ota_platform import OTAPlatform

                    market_query = await db.execute(
                        select(SourceMarket.id).where(SourceMarket.country_code == source_market.upper())
                    )
                    src_mkt_id = market_query.scalar() or 1

                    platform_query = await db.execute(
                        select(OTAPlatform.id).where(OTAPlatform.name == result.platform)
                    )
                    plat_id = platform_query.scalar() or 1

                    from app.models.ota_listing import OTAListing
                    comp_type = next((c.component_type for c in components_to_audit if c.id == result.component_id), "hotel")
                    ota_list_record = OTAListing(
                        platform_id=plat_id,
                        source_market_id=src_mkt_id,
                        component_type=comp_type,
                        raw_name=result.matched_hotel_name,
                        price=result.ota_price_local if result.ota_price_local else result.ota_price_usd,
                        currency=result.ota_currency if result.ota_currency else "USD",
                        price_usd=result.ota_price_usd if result.ota_price_usd else None,
                        url=result.matched_url,
                    )
                    db.add(ota_list_record)
                    await db.flush()  # Populates ota_list_record.id

                    match_record = ComponentMatch(
                        report_id=report.id,
                        package_component_id=result.component_id,
                        ota_listing_id=ota_list_record.id,
                        confidence=result.confidence,
                        match_method=result.match_method,
                        match_tier=result.match_tier,
                        reviewed=False,
                    )
                    db.add(match_record)
                else:
                    match_record = ComponentMatch(
                        report_id=report.id,
                        package_component_id=result.component_id,
                        ota_listing_id=None,
                        confidence=0,
                        match_method=result.match_method,
                        match_tier="unmatched",
                        reviewed=False,
                    )
                    db.add(match_record)

            # --- Update DMCPackage status ---
            package.status = status

            # In parallel mode, job completion status is handled by the orchestrator in jobs.py

            await db.commit()

            logger.info(
                f"[Audit] ✓ Complete — DMC: ${dmc_total_usd} | Market: ${market_total_usd} "
                f"| Delta: {overall_delta_pct}% | Status: {status}"
            )

            summary = AuditSummary(
                package_id=package_id,
                source_market=source_market,
                dmc_total_usd=dmc_total_usd,
                market_total_usd=market_total_usd,
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
        "components_matched": len([r for r in summary.component_results if r.ota_price_usd]),
        "components_total": len(summary.component_results),
    }
