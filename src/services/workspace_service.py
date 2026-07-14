import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Workspace, WorkspaceMember, RoleType
from src.repositories.workspace_repository import WorkspaceRepository, WorkspaceMemberRepository


class WorkspaceService:
    def __init__(self, db: AsyncSession):
        self.workspace_repo = WorkspaceRepository(db)
        self.member_repo = WorkspaceMemberRepository(db)

    async def get_workspace(self, workspace_id: uuid.UUID) -> Workspace:
        workspace = await self.workspace_repo.get_by_id(workspace_id)
        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="工作区不存在"
            )
        return workspace

    async def get_workspace_by_slug(self, slug: str) -> Workspace:
        workspace = await self.workspace_repo.get_by_slug(slug)
        if not workspace:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="工作区不存在"
            )
        return workspace

    async def get_user_workspaces(self, user_id: uuid.UUID) -> list[Workspace]:
        return await self.workspace_repo.get_all_by_user_id(user_id)

    async def create_workspace(self, name: str, slug: str, owner_id: uuid.UUID,
                               description: str = None, timezone: str = "Asia/Shanghai",
                               language: str = "zh-CN") -> Workspace:
        existing_workspace = await self.workspace_repo.get_by_slug(slug)
        if existing_workspace:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="工作区别名已存在"
            )

        workspace = await self.workspace_repo.create(
            name=name,
            slug=slug,
            owner_id=owner_id,
            description=description,
            timezone=timezone,
            language=language,
        )

        await self.member_repo.create(
            workspace_id=workspace.id,
            user_id=owner_id,
            role=RoleType.OWNER,
        )

        return workspace

    async def update_workspace(self, workspace_id: uuid.UUID, user_id: uuid.UUID, **kwargs) -> Workspace:
        workspace = await self.get_workspace(workspace_id)

        if workspace.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权限修改工作区"
            )

        return await self.workspace_repo.update(workspace, **kwargs)

    async def delete_workspace(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> None:
        workspace = await self.get_workspace(workspace_id)

        if workspace.owner_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="无权限删除工作区"
            )

        await self.workspace_repo.delete(workspace)

    async def get_workspace_members(self, workspace_id: uuid.UUID) -> list[WorkspaceMember]:
        return await self.member_repo.get_all_by_workspace_id(workspace_id)

    async def check_user_access(self, user_id: uuid.UUID, workspace_id: uuid.UUID) -> bool:
        member = await self.member_repo.get_by_workspace_and_user(workspace_id, user_id)
        return member is not None and member.is_active