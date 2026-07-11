"""
Viator / Booking.com Attractions Scraper
----------------------------------------
Scrapes excursion search results from Booking.com Attractions (which is powered by Viator/Musement).
We use this as a backdoor to Viator's inventory while bypassing their aggressive anti-bot perimeter,
leveraging the exact same DataDome bypass (Playwright + residential proxies) built for hotels.
"""

import asyncio
import logging
import json
import urllib.parse
from datetime import date, timedelta
from typing import Optional
from bs4 import BeautifulSoup

from scrapers.core.browser import ScraperBrowser
from scrapers.extractors.booking_scraper import HotelResult

logger = logging.getLogger(__name__)


class ViatorScraper:
    """
    Playwright-based scraper for Viator (via Booking.com Attractions).
    Extracts name, price, and URL directly from the SSR JSON-LD schema.
    """

    BASE_URL = "https://www.booking.com/attractions/searchresults/lk/colombo.html"

    def __init__(self, target_currency: str = "USD", checkin_date: Optional[date] = None, locale: str = "en-US"):
        self.target_currency = target_currency
        self.locale = locale
        if checkin_date:
            self.checkin = checkin_date
        else:
            # Target ~30 days in the future for maximum availability
            target_date = date.today() + timedelta(days=30)
            days_to_add = (2 - target_date.weekday()) % 7
            self.checkin = target_date + timedelta(days=days_to_add)
            
        self.checkout = self.checkin + timedelta(days=3)

    def _build_search_url(self, query: str) -> str:
        encoded_query = urllib.parse.quote_plus(query)
        date_str_start = self.checkin.strftime("%Y-%m-%d")
        date_str_end = self.checkout.strftime("%Y-%m-%d")
        
        # We use a static region slug (lk/colombo) but the ?query= handles the actual search matching
        return f"{self.BASE_URL}?query={encoded_query}&start_date={date_str_start}&end_date={date_str_end}"

    async def scrape(self, excursion_name: str, max_results: int = 10) -> list[HotelResult]:
        url = self._build_search_url(excursion_name)
        results = []

        logger.info(f"[Viator] Scraping excursion via Booking Attractions: '{excursion_name}' | URL: {url}")

        # Mirroring the successful hotel scraper proxy pool
        proxy_attempts = [
            ("residential", "GB"),
            ("isp", "GB"),
            ("residential", "DE")
        ]

        page_ctx = None
        html_content = ""
        
        for proxy_type, cc in proxy_attempts:
            try:
                page_ctx = ScraperBrowser(proxy_type=proxy_type, country_code=cc)
                page = await page_ctx.__aenter__()

                await page.set_extra_http_headers({
                    "Accept-Language": f"{self.locale},en-US;q=0.9,en;q=0.8",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Upgrade-Insecure-Requests": "1",
                })

                logger.info(f"[Viator] Navigating via {proxy_type} proxy ({cc})...")
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)

                # Check if we hit a block page
                title = await page.title()
                if "DataDome" in title or "Robot Check" in title or not title.strip():
                    raise Exception(f"Blocked or empty page (Title: {title})")
                    
                # We don't even need to wait for cards to render.
                # The data is in the SSR JSON-LD!
                await page.wait_for_timeout(2000)
                html_content = await page.content()
                break  # Success!

            except Exception as e:
                logger.warning(f"[Viator] {proxy_type} proxy failed for '{excursion_name}': {e}. Retrying...")
            finally:
                if page_ctx:
                    await page_ctx.__aexit__(None, None, None)
                    page_ctx = None

        if not html_content:
            logger.error(f"[Viator] Exhausted all proxy pools for '{excursion_name}'.")
            return []

        # Parse the JSON-LD from HTML
        soup = BeautifulSoup(html_content, "html.parser")
        scripts = soup.find_all("script", type="application/ld+json")
        
        def find_items(obj):
            if isinstance(obj, dict):
                if obj.get("@type") == "ItemList" and "itemListElement" in obj:
                    return obj["itemListElement"]
                for v in obj.values():
                    res = find_items(v)
                    if res: return res
            elif isinstance(obj, list):
                for item in obj:
                    res = find_items(item)
                    if res: return res
            return []

        items = []
        for script in scripts:
            if not script.string: continue
            try:
                data = json.loads(script.string)
                items = find_items(data)
                if items:
                    break
            except Exception:
                continue

        logger.info(f"[Viator] Extracted {len(items)} schema items from DOM.")

        if items:
            for item in items[:max_results]:
                try:
                    product = item.get("item", {})
                    if product.get("@type") != "Product":
                        continue
                        
                    name = product.get("name", "")
                    url = product.get("url", "")
                    
                    # Extract pricing from offers
                    offers = product.get("offers", {})
                    price = None
                    currency = self.target_currency
                    
                    if isinstance(offers, dict) and "price" in offers:
                        price = float(offers["price"])
                        currency = offers.get("priceCurrency", self.target_currency)
                    elif isinstance(offers, list) and len(offers) > 0:
                        price = float(offers[0].get("price", 0))
                        currency = offers[0].get("priceCurrency", self.target_currency)

                    if price:
                        # Using HotelResult as the standard internal return type for the audit pipeline
                        results.append(
                            HotelResult(
                                name=name,
                                room_type="Excursion / Tour",
                                price_per_night=price,
                                total_price=price,
                                currency=currency,
                                nights=1,
                                url=url,
                                platform="Viator",
                                raw_price_text=f"{currency} {price}"
                            )
                        )
                except Exception as e:
                    logger.debug(f"[Viator] Failed to parse product item: {e}")
        else:
            logger.info("[Viator] No JSON-LD schema found. Falling back to direct DOM extraction.")
            import re
            cards = soup.find_all(attrs={"data-testid": "card"})
            for card in cards[:max_results]:
                try:
                    title_el = card.find(attrs={"data-testid": "card-title"}) or card.find("h3")
                    if not title_el:
                        continue
                    name = title_el.get_text(strip=True)
                    link_el = title_el.find("a") or card.find("a", href=lambda href: href and "/attractions/" in href)
                    url = ""
                    if link_el and "href" in link_el.attrs:
                        url = urllib.parse.urljoin("https://www.booking.com", link_el["href"])
                    
                    card_text = card.get_text(" ", strip=True)
                    # Extract price using regex
                    price_matches = re.findall(r'(?:LKR|GBP|USD|EUR|AUD|JPY|£|\$|€|¥|￥)\s*\d+(?:[,\s]\d{3})*(?:\.\d+)?', card_text)
                    
                    price = None
                    currency = self.target_currency
                    if price_matches:
                        raw_price = price_matches[0]
                        curr_match = re.search(r'(LKR|GBP|USD|EUR|AUD|JPY|£|\$|€|¥|￥)', raw_price)
                        if curr_match:
                            currency_sym = curr_match.group(1)
                            sym_map = {"£": "GBP", "$": "USD", "€": "EUR", "¥": "JPY", "￥": "JPY"}
                            currency = sym_map.get(currency_sym, currency_sym)
                        digit_str = re.sub(r'[^\d\.]', '', raw_price.replace(',', ''))
                        if digit_str:
                            price = float(digit_str)
                            
                    if price:
                        results.append(
                            HotelResult(
                                name=name,
                                room_type="Excursion / Tour",
                                price_per_night=price,
                                total_price=price,
                                currency=currency,
                                nights=1,
                                url=url,
                                platform="Viator",
                                raw_price_text=f"{currency} {price}"
                            )
                        )
                except Exception as e:
                    logger.debug(f"[Viator] Failed to parse card: {e}")

        logger.info(f"[Viator] Scrape complete. {len(results)} excursions matched.")
        return results

async def main():
    scraper = ViatorScraper()
    res = await scraper.scrape("Half Day Colombo City Tour")
    for r in res:
        print(f"{r.name} | {r.total_price} {r.currency}")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
