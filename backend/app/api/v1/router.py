"""API Router."""

from fastapi import APIRouter

from .packages import router as packages_router
from .jobs import router as jobs_router
from .users import router as users_router

api_router = APIRouter()

api_router.include_router(packages_router, prefix="/packages", tags=["packages"])
api_router.include_router(jobs_router, prefix="/jobs", tags=["jobs"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
