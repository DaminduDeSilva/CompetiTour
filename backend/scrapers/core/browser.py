import logging
from playwright_stealth import Stealth
from playwright.async_api import async_playwright, Browser, Page
from scrapers.core.proxy_manager import get_proxy_for_task

logger = logging.getLogger(__name__)

class ScraperBrowser:
    """Provides a stealthy Playwright browser instance connected to Torch Proxies."""
    
    def __init__(self, proxy_type: str = "search", country_code: str = "DE", session_id: str = None):
        self.proxy_type = proxy_type
        self.country_code = country_code
        self.session_id = session_id
        self.playwright = None
        self.browser = None

    async def __aenter__(self) -> Page:
        self.playwright = await async_playwright().start()
        
        proxy = get_proxy_for_task(self.country_code, self.proxy_type, self.session_id)
        
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            proxy=proxy,
            args=[
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--no-sandbox'
            ]
        )
        
        context = await self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        
        # Apply stealth to browser context
        stealth_evasion = Stealth()
        await stealth_evasion.apply_stealth_async(context)
        
        page = await context.new_page()
        
        # Block heavy assets to speed up residential proxy tunnels
        async def intercept_route(route):
            if route.request.resource_type in ["image", "media", "font"]:
                await route.abort()
            else:
                await route.continue_()
                
        await page.route("**/*", intercept_route)
        
        return page

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
