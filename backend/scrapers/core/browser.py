import logging
from playwright.async_api import Page
from invisible_playwright.async_api import InvisiblePlaywright
from scrapers.core.proxy_manager import get_proxy_for_task

logger = logging.getLogger(__name__)

class ScraperBrowser:
    """Provides a stealthy browser instance via invisible_playwright (anti-detect Firefox)."""
    
    def __init__(self, proxy_type: str = "search", country_code: str = "DE"):
        self.proxy_type = proxy_type
        self.country_code = country_code
        self._ip = None
        self.browser = None

    async def __aenter__(self) -> "Page":
        proxy = get_proxy_for_task(self.country_code, self.proxy_type)
        
        self._ip = InvisiblePlaywright(proxy=proxy)
        self.browser = await self._ip.__aenter__()
        
        page = await self.browser.new_page()
        return page

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self._ip:
            await self._ip.__aexit__(exc_type, exc_val, exc_tb)
