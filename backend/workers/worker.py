"""ARQ worker configuration."""

import asyncio
from arq import worker
from arq.connections import RedisSettings
from app.config import get_settings

settings = get_settings()

# Assuming redis url is like redis://redis:6379/0
# Parse logic could be added or just hardcode host for now
REDIS_SETTINGS = RedisSettings(host='redis', port=6379, database=0)

async def startup(ctx):
    print("Worker starting up...")

async def shutdown(ctx):
    print("Worker shutting down...")

class WorkerSettings:
    functions = []  # We'll add task functions here
    redis_settings = REDIS_SETTINGS
    on_startup = startup
    on_shutdown = shutdown
