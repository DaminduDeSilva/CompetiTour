"""
Torch Labs Proxy Manager.

Provides proxy configurations for Playwright browser contexts.
Supports two proxy types:
  - Residential (X Residential via Smart Proxies): geo-targeted, rotating or sticky
  - ISP: static IP, stable long-lived sessions

Residential proxy format (from Torch Labs generation):
  gate.torchproxies.com:6011:username:password

With geo-targeting, the password is appended with country/session params:
  password_country-de_session-abc123  (sticky)
  password_country-de                 (rotating)

ISP proxy format (provided directly):
  ip:port:username:password
"""

import uuid
import logging
import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def get_residential_proxy(country_code: str, sticky: bool = False) -> dict:
    """
    Build a Playwright-compatible proxy config for Torch Labs Residential.

    Args:
        country_code: ISO 3166-1 alpha-2 code (e.g., "DE", "GB", "AU")
        sticky: If True, attempts to maintain same IP. (Disabled/rotated by default
                to ensure maximum reliability and avoid 503 service issues).

    Returns:
        Dict with 'server', 'username', 'password' keys for Playwright.
    """
    password = settings.TORCH_PASSWORD
    
    # Use working hyphenated format: password-country-de
    password = f"{password}-country-{country_code.lower()}"

    proxy_config = {
        "server": f"http://{settings.TORCH_GATEWAY_HOST}:{settings.TORCH_GATEWAY_PORT}",
        "username": settings.TORCH_USERNAME,
        "password": password,
    }

    logger.info(
        "Residential proxy configured: country=%s, rotating",
        country_code,
    )
    return proxy_config


def get_isp_proxy() -> dict:
    """
    Build a Playwright-compatible proxy config for the ISP proxy.

    ISP proxies are static IPs — same IP every time.
    Best for long pagination runs and stable sessions.

    Returns:
        Dict with 'server', 'username', 'password' keys for Playwright.
    """
    if not settings.ISP_PROXY_HOST or settings.ISP_PROXY_PORT == 0:
        raise ValueError("ISP proxy not configured. Set ISP_PROXY_* in .env")

    proxy_config = {
        "server": f"http://{settings.ISP_PROXY_HOST}:{settings.ISP_PROXY_PORT}",
        "username": settings.ISP_PROXY_USERNAME,
        "password": settings.ISP_PROXY_PASSWORD,
    }

    logger.info("ISP proxy configured: host=%s", settings.ISP_PROXY_HOST)
    return proxy_config


def get_proxy_for_task(country_code: str, task_type: str = "search") -> dict:
    """
    Select the appropriate proxy based on the task type.

    Strategy:
      - 'search': Residential sticky (anti-bot evasion, geo-targeted)
      - 'sweep':  Residential rotating (broad scans, spread load)
      - 'deep':   ISP (long stable session for pagination/rate extraction)

    Args:
        country_code: Target market country code.
        task_type: One of 'search', 'sweep', 'deep'.

    Returns:
        Playwright-compatible proxy dict.
    """
    if task_type in ("deep", "isp"):
        logger.info("Using ISP proxy for deep extraction task")
        return get_isp_proxy()
    elif task_type == "sweep":
        logger.info("Using residential rotating proxy for sweep")
        return get_residential_proxy(country_code, sticky=False)
    else:
        # Default: sticky residential for geo-targeted search
        return get_residential_proxy(country_code, sticky=True)
