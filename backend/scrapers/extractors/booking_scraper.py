"""
Booking.com Scraper
-------------------
Scrapes hotel search results from Booking.com for a given destination and date range,
routing through a geotargeted residential proxy to obtain source-market pricing.

Usage (standalone test):
    python -m scrapers.extractors.booking_scraper --destination "Yala National Park" --locale de-DE

Architecture:
    - Uses ScraperBrowser (Playwright + playwright-stealth) for anti-bot evasion
    - Routes through Torch Labs residential proxy geotargeted to the source market
    - Parses listing cards for: property name, room type, price per night, currency
    - Returns a list of HotelResult dataclass objects
"""

import asyncio
import logging
import random
import re
import argparse
from dataclasses import dataclass, field
from typing import Optional
from datetime import date, timedelta

from scrapers.core.browser import ScraperBrowser

logger = logging.getLogger(__name__)


@dataclass
class HotelResult:
    """Structured result for a single hotel listing scraped from Booking.com."""
    name: str
    room_type: Optional[str]
    price_per_night: Optional[float]
    total_price: Optional[float]
    currency: str
    nights: int
    url: str
    platform: str = "Booking.com"
    raw_price_text: str = ""


class BookingComScraper:
    """
    Playwright-based scraper for Booking.com hotel search results.

    Designed for geotargeted proxy use — pass the source market locale
    (e.g. 'de-DE', 'en-GB', 'en-AU') to match the pricing that travelers
    in that country would actually see.
    """

    BASE_URL = "https://www.booking.com/searchresults.html"

    # Booking.com locale -> Accept-Language header mapping
    LOCALE_HEADERS = {
        "de-DE": "de-DE,de;q=0.9,en;q=0.8",
        "en-GB": "en-GB,en;q=0.9",
        "en-AU": "en-AU,en;q=0.9",
        "en-US": "en-US,en;q=0.9",
        "fr-FR": "fr-FR,fr;q=0.9,en;q=0.8",
        "ja-JP": "ja-JP,ja;q=0.9,en;q=0.8",
    }

    def __init__(self, locale: str = "de-DE", nights: int = 3, checkin_date: Optional[date] = None, target_currency: str = "USD", adults: int = 2, children: int = 0, rooms: int = 1):
        self.locale = locale
        self.nights = nights
        self.target_currency = target_currency
        self.adults = adults
        self.children = children
        self.rooms = rooms
        if checkin_date:
            self.checkin = checkin_date
        else:
            # Target a mid-week day (Wednesday) approximately 30 days in the future to maximize availability
            target_date = date.today() + timedelta(days=30)
            days_to_add = (2 - target_date.weekday()) % 7
            self.checkin = target_date + timedelta(days=days_to_add)
        self.checkout = self.checkin + timedelta(days=self.nights)

    def _build_search_url(self, destination: str) -> str:
        """Constructs the Booking.com search results URL for a given destination."""
        params = {
            "ss": destination,
            "checkin": self.checkin.strftime("%Y-%m-%d"),
            "checkout": self.checkout.strftime("%Y-%m-%d"),
            "group_adults": str(self.adults),
            "req_adults": str(self.adults),
            "group_children": str(self.children),
            "req_children": str(self.children),
            "no_rooms": str(self.rooms),
            "selected_currency": self.target_currency,
            "lang": self.locale.replace("-", "_").lower(),
        }
        query_string = "&".join(f"{k}={v.replace(' ', '+')}" for k, v in params.items())
        return f"{self.BASE_URL}?{query_string}"

    def _parse_price(self, price_text: str) -> Optional[float]:
        """Extracts a numeric float from a price string like '$2,100', '€ 38', '¥ 35,750' or 'USD 2100'."""
        # Replace non-breaking spaces with regular spaces
        price_text = price_text.replace('\xa0', ' ')
        # Strip all common currency symbols and commas/spaces (including fullwidth Yen)
        cleaned = re.sub(r"[$$£¥￥₩€,\s]", "", price_text)
        # Remove currency codes
        cleaned = re.sub(r"[A-Z]{2,}", "", cleaned).strip()
        try:
            return float(cleaned)
        except ValueError:
            logger.debug(f"Could not parse price from: '{price_text}'")
            return None

    async def scrape(self, destination: str, max_results: int = 15) -> list["HotelResult"]:
        """
        Performs the full scrape for a destination.

        Args:
            destination: Hotel or location name to search (e.g. "Cinnamon Wild Yala")
            max_results: Max number of hotel results to return

        Returns:
            List of HotelResult objects sorted by total_price ascending
        """
        url = self._build_search_url(destination)
        results: list[HotelResult] = []

        logger.info(f"[Booking.com] Scraping: '{destination}' | Locale: {self.locale} | URL: {url}")

        accept_language = self.LOCALE_HEADERS.get(self.locale, "en-US,en;q=0.9")
        country_code = self.locale.split("-")[1].upper() if "-" in self.locale else "DE"

        proxy_attempts = [
            ("residential", country_code, None),
            ("isp", country_code, None)
        ]
        page_ctx = None
        used_proxy = None

        for proxy_type, cc, session_id in proxy_attempts:
            try:
                # Small fixed delay between retries
                await asyncio.sleep(0.5)
                page_ctx = ScraperBrowser(proxy_type=proxy_type, country_code=cc, session_id=session_id)
                page = await page_ctx.__aenter__()
                await page.set_extra_http_headers({
                    "Accept-Language": accept_language,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                })
                logger.info(f"[Booking.com] Navigating via {proxy_type} proxy...")
                await page.goto(url, wait_until="commit", timeout=30000)
                used_proxy = proxy_type
                
                # Handle consent/cookie banner if present (common on EU locales)
                try:
                    consent_btn = page.locator('[id="onetrust-accept-btn-handler"], [aria-label="Accept"], button:has-text("Accept")').first
                    if await consent_btn.is_visible(timeout=1500):
                        await consent_btn.click()
                        logger.info("[Booking.com] Dismissed cookie consent banner.")
                        await page.wait_for_timeout(1000)
                except Exception:
                    pass  # No banner, continue

                # Wait for property cards to load
                try:
                    el = await page.wait_for_selector('[data-testid="property-card"], #challenge-container', timeout=30000)
                    if await el.get_attribute("id") == "challenge-container":
                        logger.info("[Booking.com] WAF challenge detected. Waiting for it to resolve...")
                        await page.wait_for_selector('[data-testid="property-card"]', timeout=30000)
                    logger.info("[Booking.com] Property cards loaded.")
                except Exception as e:
                    # Check if we were blocked or got a captcha
                    try:
                        html = await page.content()
                        block_indicators = ["access denied", "pardon our interruption", "robot check", "security challenge", "automated agent", "verify you are a human", "press & hold", "press and hold"]
                        is_blocked = any(ind in html.lower() for ind in block_indicators) or len(html) < 5000
                        if is_blocked:
                            title = await page.title()
                            with open("dump.html", "w") as f:
                                f.write(html)
                            raise Exception(f"Blocked or empty page (Title: {title}, html={len(html)}b)")
                    except Exception as block_err:
                        if "Blocked" in str(block_err):
                            raise block_err
                    logger.warning("[Booking.com] Timeout waiting for property cards — page may have changed structure.")
                    cards = []
                else:
                    cards = await page.query_selector_all('[data-testid="property-card"]')

                logger.info(f"[Booking.com] Found {len(cards)} property cards. Extracting top {max_results}...")

                for card in cards[:max_results]:
                    try:
                        # --- Property Name ---
                        name_el = await card.query_selector('[data-testid="title"]')
                        name = (await name_el.inner_text()).strip() if name_el else "Unknown"

                        # --- Room/Unit Type ---
                        room_el = await card.query_selector('[data-testid="recommended-units"] h4, .hprt-table .hprt-roomtype-icon-link')
                        room_type = (await room_el.inner_text()).strip() if room_el else None

                        # --- Price ---
                        price_el = await card.query_selector(
                            '[data-testid="price-and-discounted-price"] [data-testid="price-and-discounted-price"] span, '
                            '[data-testid="price-and-discounted-price"], '
                            '.bui-price-display__value, '
                            '[data-testid="priceForXNights"]'
                        )
                        raw_price_text = (await price_el.inner_text()).strip() if price_el else ""
                        total_price = self._parse_price(raw_price_text)
                        price_per_night = round(total_price / self.nights, 2) if total_price else None

                        # --- Detect currency from page ---
                        currency = self.target_currency
                        if raw_price_text:
                            if "£" in raw_price_text:
                                currency = "GBP"
                            elif "$" in raw_price_text:
                                currency = "USD"
                            elif "A$" in raw_price_text:
                                currency = "AUD"
                            elif "€" in raw_price_text:
                                currency = "EUR"
                            elif "¥" in raw_price_text or "￥" in raw_price_text or "JPY" in raw_price_text:
                                currency = "JPY"

                        # --- Property URL ---
                        link_el = await card.query_selector('a[data-testid="title-link"]')
                        href = await link_el.get_attribute("href") if link_el else ""
                        full_url = f"https://www.booking.com{href}" if href and href.startswith("/") else href

                        result = HotelResult(
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
                        logger.warning(f"[Booking.com] Failed to parse card: {e}")
                        continue
                
                # Success! Close browser and exit proxy loop
                try:
                    await page_ctx.__aexit__(None, None, None)
                except Exception:
                    pass
                break

            except Exception as e:
                logger.warning(f"[Booking.com] {proxy_type} proxy failed for '{destination}': {type(e).__name__} - {str(e)}. {'Retrying with ISP...' if proxy_type == 'residential' else 'All proxies exhausted.'}")
                if page_ctx:
                    try:
                        await page_ctx.__aexit__(None, None, None)
                    except Exception:
                        pass
                page_ctx = None
                page = None
                if proxy_type == "isp":
                    logger.error(f"[Booking.com] Both proxies failed for '{destination}'. Returning empty results.")
                    return []
                continue

        logger.info(f"[Booking.com] Scrape complete. {len(results)} results extracted.")

        # Sort by total_price ascending (cheapest first)
        results.sort(key=lambda r: r.total_price or float("inf"))
        return results

    async def scrape_detail_page(self, url: str) -> Optional[float]:
        """
        Extracts hotel pricing via Booking.com's internal AvailabilityCalendar GraphQL API.

        Approach (per Scrapfly research guide):
          1. Load the hotel detail page to get hotelCountry, hotelName, b_csrf_token from HTML source
          2. POST to /dml/graphql in the SAME browser session using those values
          3. Parse avgPriceFormatted from the response days array
        """
        import json
        import re
        import urllib.parse

        logger.info(f"[Booking.com] GraphQL pricing for: {url[:80]}...")

        # Build a clean hotel detail URL (strip tracking params, keep dates)
        parsed = urllib.parse.urlparse(url)
        qs = urllib.parse.parse_qs(parsed.query)
        checkin_str = qs.get("checkin", [self.checkin.strftime("%Y-%m-%d") if self.checkin else ""])[0]
        checkout_str = qs.get("checkout", [self.checkout.strftime("%Y-%m-%d") if self.checkout else ""])[0]

        # Normalise path: strip locale suffix (.de.html → .html) for API pagename extraction
        clean_path = re.sub(r'\.[a-z]{2}(-[a-z]{2})?\.html$', '.html', parsed.path)
        clean_url = (
            f"https://www.booking.com{clean_path}"
            f"?checkin={checkin_str}&checkout={checkout_str}"
            f"&group_adults={self.adults}&no_rooms={self.rooms}&selected_currency={self.target_currency}"
        )

        accept_language = self.LOCALE_HEADERS.get(self.locale, "de-DE,de;q=0.9,en;q=0.8")
        country_code = self.locale.split("-")[1].upper() if "-" in self.locale else "DE"
        gql_lang = self.locale.replace("-", "_").lower()

        for proxy_type in ("residential", "isp"):
            page_ctx = ScraperBrowser(proxy_type=proxy_type, country_code=country_code)
            try:
                page = await page_ctx.__aenter__()
                await page.set_extra_http_headers({
                    "Accept-Language": accept_language,
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                })

                await page.goto(clean_url, wait_until="commit", timeout=45000)

                try:
                    el = await page.wait_for_selector('h2, #challenge-container', timeout=15000)
                    if await el.get_attribute("id") == "challenge-container":
                        logger.info("[Booking.com Detail] WAF challenge detected. Waiting for it to resolve...")
                        await page.wait_for_selector('h2', timeout=15000)
                except Exception:
                    pass

                # --- NEW DOM EXTRACTION LOGIC (Fallback from manual testing) ---
                # Attempt to extract price directly from HTML elements before trying complex GraphQL
                try:
                    await page.wait_for_timeout(2000) # Let dynamic prices load
                    price_elements = await page.query_selector_all('.prco-valign-middle-helper, [data-testid="price-and-discounted-price"], .bui-price-display__value')
                    for p_el in price_elements:
                        text = await p_el.inner_text()
                        if text:
                            val = self._parse_price(text)
                            if val and val > 0:
                                logger.info(f"[Booking.com] Detail page DOM extraction SUCCESS via {proxy_type}: {val} (raw: {text.strip()})")
                                await page_ctx.__aexit__(None, None, None)
                                return val
                    logger.debug(f"[Booking.com] DOM extraction found no valid prices via {proxy_type}. Proceeding to GraphQL...")
                except Exception as dom_e:
                    logger.debug(f"[Booking.com] DOM extraction failed: {dom_e}")
                # ---------------------------------------------------------------

                # Hotel meta (hotelCountry, b_csrf_token) is JS-rendered.
                # Retry scroll+wait up to 3 times until the full page renders.
                html = ""
                hotel_country_m = hotel_name_m = csrf_m = None
                for _wait_attempt in range(3):
                    await page.evaluate("window.scrollBy(0, 1200)")
                    await page.wait_for_timeout(2000)
                    html = await page.content()
                    hotel_country_m = re.search(r'hotelCountry[^a-zA-Z0-9]{1,5}["\']([^"\']+)["\']', html)
                    hotel_name_m = re.search(r'hotelName[^a-zA-Z0-9]{1,5}["\']([^"\']+)["\']', html)
                    csrf_m = re.search(r'b_csrf_token[^a-zA-Z0-9]{1,5}["\']([^"\']+)["\']', html)
                    if hotel_country_m and hotel_name_m and csrf_m:
                        break
                    logger.debug(f"[Booking.com] Meta not found yet (attempt {_wait_attempt+1}/3, html={len(html)}b). Waiting more...")

                if not (hotel_country_m and hotel_name_m and csrf_m):
                    logger.warning(
                        f"[Booking.com] Could not extract hotel meta from page via {proxy_type} (html_len={len(html)}). "
                        f"{'Trying ISP...' if proxy_type == 'residential' else 'Giving up.'}"
                    )
                    await page_ctx.__aexit__(None, None, None)
                    continue

                hotel_country = hotel_country_m.group(1)
                hotel_name = hotel_name_m.group(1)
                csrf_token = csrf_m.group(1)
                referer_url = page.url

                logger.info(f"[Booking.com] Hotel meta → country={hotel_country}, name={hotel_name}")

                # Build the AvailabilityCalendar GraphQL body — search 30 days to find available dates
                gql_body = json.dumps({
                    "operationName": "AvailabilityCalendar",
                    "variables": {
                        "input": {
                            "travelPurpose": 2,
                            "pagenameDetails": {
                                "countryCode": hotel_country,
                                "pagename": hotel_name,
                            },
                            "searchConfig": {
                                "searchConfigDate": {
                                    "startDate": checkin_str,
                                    "amountOfDays": 60,
                                },
                                "nbAdults": 2,
                                "nbRooms": 1,
                            },
                        }
                    },
                    "extensions": {},
                    "query": (
                        "query AvailabilityCalendar($input: AvailabilityCalendarQueryInput!) {\n"
                        "  availabilityCalendar(input: $input) {\n"
                        "    ... on AvailabilityCalendarQueryResult {\n"
                        "      hotelId\n"
                        "      days {\n"
                        "        available\n"
                        "        avgPriceFormatted\n"
                        "        checkin\n"
                        "        minLengthOfStay\n"
                        "        __typename\n"
                        "      }\n"
                        "      __typename\n"
                        "    }\n"
                        "    ... on AvailabilityCalendarQueryError {\n"
                        "      message\n"
                        "      __typename\n"
                        "    }\n"
                        "    __typename\n"
                        "  }\n"
                        "}\n"
                    ),
                }, separators=(",", ":"))

                # Call the GraphQL endpoint from inside the same browser session
                # This reuses session cookies so the CSRF token is valid
                # Note: page.evaluate() only accepts a single optional arg
                gql_args = {
                    "body": gql_body,
                    "csrf": csrf_token,
                    "ref": referer_url,
                    "lang": gql_lang,
                }
                gql_response = await page.evaluate("""
                    async (args) => {
                        try {
                            const resp = await fetch(
                                'https://www.booking.com/dml/graphql?lang=' + args.lang,
                                {
                                    method: 'POST',
                                    headers: {
                                        'content-type': 'application/json',
                                        'x-booking-csrf-token': args.csrf,
                                        'referer': args.ref,
                                        'origin': 'https://www.booking.com',
                                    },
                                    body: args.body,
                                }
                            );
                            return await resp.json();
                        } catch(e) {
                            return { error: e.toString() };
                        }
                    }
                """, gql_args)

                await page_ctx.__aexit__(None, None, None)

                if gql_response and "error" in gql_response:
                    logger.warning(f"[Booking.com] GraphQL fetch error: {gql_response['error']}")
                    continue

                # Parse daily prices from response
                data = (gql_response or {}).get("data") or {}
                avail_cal = data.get("availabilityCalendar") or {}
                days = avail_cal.get("days") or []

                prices = []
                for day in days:
                    if day.get("available") and day.get("avgPriceFormatted"):
                        val = self._parse_price(str(day["avgPriceFormatted"]))
                        if val and val > 0:
                            prices.append(val)

                if prices:
                    min_price = min(prices)
                    logger.info(
                        f"[Booking.com] AvailabilityCalendar ({proxy_type}) → "
                        f"prices={prices[:5]} | min={min_price}"
                    )
                    return min_price

                logger.warning(
                    f"[Booking.com] AvailabilityCalendar returned no available pricing via {proxy_type}. "
                    f"{'Trying ISP...' if proxy_type == 'residential' else 'Giving up.'}"
                )

            except Exception as e:
                logger.warning(
                    f"[Booking.com] scrape_detail_page failed via {proxy_type}: "
                    f"{type(e).__name__}: {str(e)[:120]}. "
                    f"{'Trying ISP...' if proxy_type == 'residential' else 'Giving up.'}"
                )
                try:
                    await page_ctx.__aexit__(None, None, None)
                except Exception:
                    pass

        return None


# ---------------------------------------------------------------------------
# Standalone CLI test runner
# ---------------------------------------------------------------------------
async def _run_cli(destination: str, locale: str, nights: int):
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
    scraper = BookingComScraper(locale=locale, nights=nights)
    results = await scraper.scrape(destination)

    if not results:
        print("\n[!] No results found.")
        return

    print(f"\n{'='*60}")
    print(f"  Booking.com Results: '{destination}' ({locale})")
    print(f"  Check-in: {scraper.checkin} | Nights: {nights}")
    print(f"{'='*60}")
    for r in results:
        print(f"  {r.name}")
        print(f"    Room : {r.room_type or 'N/A'}")
        print(f"    Price: {r.currency} {r.total_price} total ({r.currency} {r.price_per_night}/night)")
        print(f"    URL  : {r.url[:80]}...")
        print()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Booking.com scraper test runner")
    parser.add_argument("--destination", type=str, default="Cinnamon Wild Yala", help="Search destination")
    parser.add_argument("--locale", type=str, default="de-DE", help="Source market locale (e.g. de-DE, en-GB)")
    parser.add_argument("--nights", type=int, default=3, help="Number of nights")
    args = parser.parse_args()

    asyncio.run(_run_cli(args.destination, args.locale, args.nights))
