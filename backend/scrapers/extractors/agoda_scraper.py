"""
Agoda Scraper
-------------
Scrapes hotel search results from Agoda for a given destination,
routing through a geotargeted ISP/residential proxy.

Usage (standalone test):
    python -m scrapers.extractors.agoda_scraper --destination "Cinnamon Wild Yala" --locale de-DE

Architecture:
    - Uses ScraperBrowser (Playwright + playwright-stealth) via ISP proxy for sticky sessions
    - Agoda uses heavier bot detection (Akamai), so stealth mode + ISP proxy is recommended
    - Parses listing cards for: property name, room type, nightly rate, currency
"""

import asyncio
import logging
import re
import argparse
from dataclasses import dataclass
from typing import Optional
from datetime import date, timedelta

from scrapers.core.browser import ScraperBrowser

logger = logging.getLogger(__name__)


@dataclass
class AgodaHotelResult:
    """Structured result for a single hotel listing scraped from Agoda."""
    name: str
    room_type: Optional[str]
    price_per_night: Optional[float]
    total_price: Optional[float]
    currency: str
    nights: int
    url: str
    platform: str = "Agoda"
    raw_price_text: str = ""


class AgodaScraper:
    """
    Playwright-based scraper for Agoda hotel search results.

    Agoda is significantly harder to scrape than Booking.com due to Akamai bot
    protection. We use ISP proxies (sticky session) + full playwright-stealth to
    blend in as a regular browser session.
    """

    BASE_URL = "https://www.agoda.com/search"

    # Agoda country site codes for geotargeting
    LOCALE_SITE_MAP = {
        "de-DE": "de-de",
        "en-GB": "en-gb",
        "en-AU": "en-au",
        "en-US": "en-us",
        "fr-FR": "fr-fr",
        "ja-JP": "ja-jp",
    }

    LOCALE_HEADERS = {
        "de-DE": "de-DE,de;q=0.9,en;q=0.8",
        "en-GB": "en-GB,en;q=0.9",
        "en-AU": "en-AU,en;q=0.9",
        "en-US": "en-US,en;q=0.9",
        "fr-FR": "fr-FR,fr;q=0.9,en;q=0.8",
        "ja-JP": "ja-JP,ja;q=0.9,en;q=0.8",
    }

    def __init__(self, locale: str = "de-DE", nights: int = 3, checkin_date: Optional[date] = None):
        self.locale = locale
        self.nights = nights
        if checkin_date:
            self.checkin = checkin_date
        else:
            # Target a mid-week day (Wednesday) approximately 30 days in the future to maximize availability
            target_date = date.today() + timedelta(days=30)
            days_to_add = (2 - target_date.weekday()) % 7
            self.checkin = target_date + timedelta(days=days_to_add)
        self.checkout = self.checkin + timedelta(days=self.nights)

    def _build_search_url(self, destination: str) -> str:
        """Constructs the Agoda search URL."""
        site_lang = self.LOCALE_SITE_MAP.get(self.locale, "en-us")
        checkin_str = self.checkin.strftime("%Y-%m-%d")
        checkout_str = self.checkout.strftime("%Y-%m-%d")
        dest_encoded = destination.replace(" ", "+")
        return (
            f"https://www.agoda.com/{site_lang}/search"
            f"?q={dest_encoded}"
            f"&checkIn={checkin_str}"
            f"&checkOut={checkout_str}"
            f"&rooms=1&adults=2"
            f"&cid=-218&currency=USD"
        )

    def _parse_price(self, price_text: str) -> Optional[float]:
        """Extracts a numeric float from Agoda price text."""
        cleaned = re.sub(r"[$$£¥₩,\s]", "", price_text)
        cleaned = re.sub(r"[A-Z]{2,}", "", cleaned).strip()
        try:
            return float(cleaned)
        except ValueError:
            logger.debug(f"Could not parse price from: '{price_text}'")
            return None

    async def scrape(self, destination: str, max_results: int = 15) -> list[AgodaHotelResult]:
        """
        Performs a full Agoda scrape for a given hotel/destination.

        Args:
            destination: The hotel name or area to search
            max_results: Maximum number of results to collect

        Returns:
            List of AgodaHotelResult sorted by total_price ascending
        """
        url = self._build_search_url(destination)
        results: list[AgodaHotelResult] = []
        accept_language = self.LOCALE_HEADERS.get(self.locale, "en-US,en;q=0.9")

        logger.info(f"[Agoda] Scraping: '{destination}' | Locale: {self.locale} | URL: {url}")

        proxy_type = "isp"
        country_code = self.locale.split("-")[1].upper() if "-" in self.locale else "DE"
        
        browser_ctx = None
        try:
            try:
                browser_ctx = ScraperBrowser(proxy_type=proxy_type, country_code=country_code)
                page = await browser_ctx.__aenter__()
                await page.set_extra_http_headers({
                    "Accept-Language": accept_language,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Sec-Fetch-Site": "none",
                    "Sec-Fetch-Mode": "navigate",
                })
                logger.info("[Agoda] Navigating to search results...")
                await page.goto(url, wait_until="networkidle", timeout=35000)
            except ValueError as e:
                logger.warning(f"[Agoda] ISP proxy unavailable ({e}), falling back to residential proxy.")
                if browser_ctx:
                    await browser_ctx.__aexit__(None, None, None)
                
                browser_ctx = ScraperBrowser(proxy_type="residential", country_code=country_code)
                page = await browser_ctx.__aenter__()
                await page.set_extra_http_headers({
                    "Accept-Language": accept_language,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Sec-Fetch-Site": "none",
                    "Sec-Fetch-Mode": "navigate",
                })
                logger.info("[Agoda] Fallback: Navigating to search results via residential proxy...")
                await page.goto(url, wait_until="domcontentloaded", timeout=35000)

            # Handle cookie consent (common in EU)
            try:
                consent = page.locator('button:has-text("Accept"), [data-selenium="accept-button"]').first
                if await consent.is_visible(timeout=3000):
                    await consent.click()
                    await page.wait_for_timeout(1500)
                    logger.info("[Agoda] Dismissed cookie consent.")
            except Exception:
                pass

            # Wait for property cards — Agoda uses data-selenium or class-based selectors
            try:
                await page.wait_for_selector(
                    '[data-selenium="hotel-item"], .PropertyCard, li[data-element-name="search-result-hotel-card"]',
                    timeout=15000
                )
                logger.info("[Agoda] Property cards loaded.")
            except Exception:
                logger.warning("[Agoda] Timeout waiting for cards — site structure may have changed.")

            # Try multiple card selectors for resilience
            cards = await page.query_selector_all('[data-selenium="hotel-item"]')
            if not cards:
                cards = await page.query_selector_all('li[data-element-name="search-result-hotel-card"]')
            if not cards:
                cards = await page.query_selector_all('.PropertyCard')

            logger.info(f"[Agoda] Found {len(cards)} property cards. Extracting top {max_results}...")

            for card in cards[:max_results]:
                try:
                    # --- Property Name ---
                    name_el = await card.query_selector(
                        '[data-selenium="hotel-name"], .PropertyCard__HotelName, h3.item_name'
                    )
                    name = (await name_el.inner_text()).strip() if name_el else "Unknown"

                    # --- Room Type ---
                    room_el = await card.query_selector(
                        '[data-selenium="room-name"], .RoomName, .ChildRoomsList-roomName'
                    )
                    room_type = (await room_el.inner_text()).strip() if room_el else None

                    # --- Price ---
                    price_el = await card.query_selector(
                        '[data-selenium="display-price"], .PropertyCardPrice__Value, '
                        '.priceInfo .price, [data-element-name="price"]'
                    )
                    raw_price_text = (await price_el.inner_text()).strip() if price_el else ""
                    total_price = self._parse_price(raw_price_text)
                    price_per_night = round(total_price / self.nights, 2) if total_price else None

                    # --- Currency detection ---
                    currency = "USD"
                    if raw_price_text:
                        if "£" in raw_price_text:
                            currency = "GBP"
                        elif "A$" in raw_price_text:
                            currency = "AUD"
                        elif "$" in raw_price_text and "A$" not in raw_price_text:
                            currency = "USD"

                    # --- URL ---
                    link_el = await card.query_selector("a")
                    href = await link_el.get_attribute("href") if link_el else ""
                    full_url = f"https://www.agoda.com{href}" if href and href.startswith("/") else href or ""

                    result = AgodaHotelResult(
                        name=name,
                        room_type=room_type,
                        price_per_night=price_per_night,
                        total_price=total_price,
                        currency=currency,
                        nights=self.nights,
                        url=full_url,
                        raw_price_text=raw_price_text,
                    )
                    results.append(result)
                    logger.info(f"  → {name} | {room_type} | {raw_price_text}")

                except Exception as e:
                    logger.warning(f"[Agoda] Failed to parse card: {e}")
                    continue
        finally:
            if browser_ctx:
                await browser_ctx.__aexit__(None, None, None)

        logger.info(f"[Agoda] Scrape complete. {len(results)} results extracted.")
        results.sort(key=lambda r: r.total_price or float("inf"))
        return results


# ---------------------------------------------------------------------------
# Standalone CLI test runner
# ---------------------------------------------------------------------------
async def _run_cli(destination: str, locale: str, nights: int):
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    scraper = AgodaScraper(locale=locale, nights=nights)
    results = await scraper.scrape(destination)

    if not results:
        print("\n[!] No results found.")
        return

    print(f"\n{'='*60}")
    print(f"  Agoda Results: '{destination}' ({locale})")
    print(f"  Check-in: {scraper.checkin} | Nights: {nights}")
    print(f"{'='*60}")
    for r in results:
        print(f"  {r.name}")
        print(f"    Room : {r.room_type or 'N/A'}")
        print(f"    Price: {r.currency} {r.total_price} total ({r.currency} {r.price_per_night}/night)")
        print(f"    URL  : {r.url[:80]}...")
        print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Agoda scraper test runner")
    parser.add_argument("--destination", type=str, default="Cinnamon Wild Yala")
    parser.add_argument("--locale", type=str, default="de-DE")
    parser.add_argument("--nights", type=int, default=3)
    args = parser.parse_args()

    asyncio.run(_run_cli(args.destination, args.locale, args.nights))
