import re
import uuid
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.security import verify_password, create_access_token, create_refresh_token
from src.db.models import User, Workspace, WorkspaceMember, RoleType
from src.repositories.user_repository import UserRepository
from src.repositories.workspace_repository import WorkspaceRepository, WorkspaceMemberRepository


def generate_workspace_slug(name: str) -> str:
    slug = re.sub(r'[^a-zA-Z0-9\u4e00-\u9fff]', '-', name).lower()
    slug = re.sub(r'-+', '-', slug).strip('-')
    if not slug:
        slug = 'workspace'
    return slug[:50]


class AuthService:
    def __init__(self, db: AsyncSession):
        self.user_repo = UserRepository(db)
        self.workspace_repo = WorkspaceRepository(db)
        self.member_repo = WorkspaceMemberRepository(db)

    async def register(self, email: str, password: str, full_name: str, workspace_name: str) -> dict:
        existing_user = await self.user_repo.get_by_email(email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )

        user = await self.user_repo.create(email, password, full_name)

        workspace_slug = generate_workspace_slug(workspace_name)
        workspace = await self.workspace_repo.create(
            name=workspace_name,
            slug=workspace_slug,
            owner_id=user.id,
            timezone="Asia/Shanghai",
            language="zh-CN",
        )

        await self.member_repo.create(
            workspace_id=workspace.id,
            user_id=user.id,
            role=RoleType.OWNER,
        )

        token_data = {"sub": str(user.id), "email": user.email}
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(token_data, access_token_expires)
        refresh_token = create_refresh_token(token_data)
        expires_at = datetime.utcnow() + access_token_expires

        return {
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
            },
            "workspace": {
                "id": workspace.id,
                "name": workspace.name,
                "slug": workspace.slug,
            },
            "tokens": {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_at": expires_at,
            },
        }

    async def login(self, email: str, password: str) -> dict:
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="邮箱或密码错误"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="用户已被禁用"
            )

        token_data = {"sub": str(user.id), "email": user.email}
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(token_data, access_token_expires)
        refresh_token = create_refresh_token(token_data)
        expires_at = datetime.utcnow() + access_token_expires

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_at": expires_at,
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
            },
        }

    async def refresh_token(self, refresh_token: str) -> dict:
        try:
            payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("sub")
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="无效的令牌"
                )
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的令牌"
            )

        user = await self.user_repo.get_by_id(uuid.UUID(user_id))
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户不存在或已被禁用"
            )

        token_data = {"sub": str(user.id), "email": user.email}
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(token_data, access_token_expires)
        expires_at = datetime.utcnow() + access_token_expires

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_at": expires_at,
        }

    async def get_current_user(self, token: str) -> User:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            user_id = payload.get("sub")
            if user_id is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="无效的令牌"
                )
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的令牌"
            )

        user = await self.user_repo.get_by_id(uuid.UUID(user_id))
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户不存在或已被禁用"
            )
        return user

    async def get_user_workspace_role(self, user_id: uuid.UUID, workspace_id: uuid.UUID) -> RoleType:
        member = await self.member_repo.get_by_workspace_and_user(workspace_id, user_id)
        if not member or not member.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="用户不是该工作区成员"
            )
        return member.role