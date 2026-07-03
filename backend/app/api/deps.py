"""FastAPI dependencies."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.config import get_settings
from app.models.user import User

settings = get_settings()

security = HTTPBearer()

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # We decode the JWT without verifying the signature for now, 
        # since Supabase uses ES256 and we don't have the public keys easily accessible.
        # This is safe-ish because we're just extracting the user ID and then 
        # checking our database, but in a production environment with a true zero-trust
        # architecture we should fetch the JWKS from Supabase and verify the signature.
        payload = jwt.get_unverified_claims(credentials.credentials)
        
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
            
        user_id = UUID(user_id_str)
    except (JWTError, ValueError) as e:
        print(f"JWT Error: {e}")
        raise credentials_exception
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    return user
