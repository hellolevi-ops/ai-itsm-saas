import uuid
from typing import Optional, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import Workspace, WorkspaceMember, RoleType
from datetime import datetime


class WorkspaceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, workspace_id: uuid.UUID) -> Optional[Workspace]:
        result = await self.db.execute(select(Workspace).where(Workspace.id == workspace_id))
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Optional[Workspace]:
        result = await self.db.execute(select(Workspace).where(Workspace.slug == slug))
        return result.scalar_one_or_none()

    async def get_by_owner_id(self, owner_id: uuid.UUID) -> Optional[Workspace]:
        result = await self.db.execute(select(Workspace).where(Workspace.owner_id == owner_id))
        return result.scalar_one_or_none()

    async def get_all_by_user_id(self, user_id: uuid.UUID) -> List[Workspace]:
        result = await self.db.execute(
            select(Workspace)
            .join(WorkspaceMember)
            .where(WorkspaceMember.user_id == user_id)
        )
        return result.scalars().all()

    async def create(self, name: str, slug: str, owner_id: uuid.UUID, description: Optional[str] = None,
                     timezone: str = "Asia/Shanghai", language: str = "zh-CN") -> Workspace:
        workspace = Workspace(
            name=name,
            slug=slug,
            description=description,
            timezone=timezone,
            language=language,
            is_active=True,
            owner_id=owner_id,
        )
        self.db.add(workspace)
        await self.db.commit()
        await self.db.refresh(workspace)
        return workspace

    async def update(self, workspace: Workspace, **kwargs) -> Workspace:
        for key, value in kwargs.items():
            setattr(workspace, key, value)
        await self.db.commit()
        await self.db.refresh(workspace)
        return workspace

    async def delete(self, workspace: Workspace) -> None:
        await self.db.delete(workspace)
        await self.db.commit()


class WorkspaceMemberRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_workspace_and_user(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> Optional[WorkspaceMember]:
        result = await self.db.execute(
            select(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == workspace_id)
            .where(WorkspaceMember.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_all_by_workspace_id(self, workspace_id: uuid.UUID) -> List[WorkspaceMember]:
        result = await self.db.execute(
            select(WorkspaceMember).where(WorkspaceMember.workspace_id == workspace_id)
        )
        return result.scalars().all()

    async def get_all_by_user_id(self, user_id: uuid.UUID) -> List[WorkspaceMember]:
        result = await self.db.execute(
            select(WorkspaceMember).where(WorkspaceMember.user_id == user_id)
        )
        return result.scalars().all()

    async def create(self, workspace_id: uuid.UUID, user_id: uuid.UUID, role: RoleType = RoleType.REQUESTER) -> WorkspaceMember:
        member = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=user_id,
            role=role,
            joined_at=datetime.utcnow(),
            is_active=True,
        )
        self.db.add(member)
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def update_role(self, member: WorkspaceMember, role: RoleType) -> WorkspaceMember:
        member.role = role
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def remove(self, member: WorkspaceMember) -> None:
        await self.db.delete(member)
        await self.db.commit()