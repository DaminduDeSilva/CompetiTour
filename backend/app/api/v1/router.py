"""API Router."""

from fastapi import APIRouter

from .v1.packages import router as packages_router
from .v1.auth import router as auth_router
# from .v1.reports import router as reports_router
# from .v1.jobs import router as jobs_router
# from .v1.dashboard import router as dashboard_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(packages_router, prefix="/packages", tags=["packages"])
# api_router.include_router(reports_router, prefix="/reports", tags=["reports"])
# api_router.include_router(jobs_router, prefix="/jobs", tags=["jobs"])
# api_router.include_router(dashboard_router, prefix="/dashboard", tags=["dashboard"])
