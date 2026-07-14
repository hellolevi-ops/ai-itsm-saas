from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, RefreshTokenRequest
from src.services.auth_service import AuthService
from src.db.session import get_db

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    auth_service = AuthService(db)
    result = await auth_service.register(
        email=request.email,
        password=request.password,
        full_name=request.full_name,
        workspace_name=request.workspace_name,
    )
    return result


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    auth_service = AuthService(db)
    result = await auth_service.login(
        email=request.email,
        password=request.password,
    )
    return result


@router.post("/refresh-token")
async def refresh_token(
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    auth_service = AuthService(db)
    result = await auth_service.refresh_token(refresh_token=request.refresh_token)
    return result