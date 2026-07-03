"""FastAPI application factory."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.v1.router import api_router

settings = get_settings()

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("CompetiTour API starting up — env=%s", settings.ENVIRONMENT)
    
    # Auto-seed basic reference tables if they are empty
    try:
        from app.database import async_session_factory
        from app.models.source_market import SourceMarket
        from app.models.ota_platform import OTAPlatform
        from sqlalchemy import select

        async with async_session_factory() as session:
            # Seed source markets
            res_m = await session.execute(select(SourceMarket))
            if not res_m.scalars().first():
                session.add(SourceMarket(country_code="DE", country_name="Germany", currency="EUR", locale="de-DE", timezone="Europe/Berlin"))
                session.add(SourceMarket(country_code="GB", country_name="United Kingdom", currency="GBP", locale="en-GB", timezone="Europe/London"))
                session.add(SourceMarket(country_code="AU", country_name="Australia", currency="AUD", locale="en-AU", timezone="Australia/Sydney"))
                logger.info("Seeding source markets...")
            
            # Seed platforms
            res_p = await session.execute(select(OTAPlatform))
            if not res_p.scalars().first():
                session.add(OTAPlatform(name="Booking.com", base_url="https://www.booking.com", scrape_config={}))
                session.add(OTAPlatform(name="Agoda", base_url="https://www.agoda.com", scrape_config={}))
                logger.info("Seeding OTA platforms...")
            
            await session.commit()
    except Exception as e:
        logger.error(f"Error seeding reference data: {e}")

    yield
    logger.info("CompetiTour API shutting down")


app = FastAPI(
    title="CompetiTour API",
    description="AI-powered package competitiveness intelligence for DMCs",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS — allow frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://frontend:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "competitour-api"}
