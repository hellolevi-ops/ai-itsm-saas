from typing import Optional

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from src.core.config import settings
from src.services.auth_service import AuthService
from src.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession

oauth2_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict:
    token = credentials.credentials
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)
    return {"id": user.id, "email": user.email, "full_name": user.full_name}


async def get_tenant_context(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> dict:
    token = credentials.credentials
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    workspace_id = request.headers.get("X-Workspace-Id")
    if not workspace_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="缺少 X-Workspace-Id 头"
        )

    role = await auth_service.get_user_workspace_role(user.id, workspace_id)

    return {
        "user": {"id": user.id, "email": user.email},
        "workspace_id": workspace_id,
        "role": role,
    }


async def require_workspace_admin(
    tenant_context: dict = Depends(get_tenant_context),
) -> dict:
    if tenant_context["role"] not in ["admin", "owner"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    return tenant_context


async def require_workspace_owner(
    tenant_context: dict = Depends(get_tenant_context),
) -> dict:
    if tenant_context["role"] != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要所有者权限"
        )
    return tenant_context