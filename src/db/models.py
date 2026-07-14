import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import String, Boolean, ForeignKey, DateTime, Text, UUID, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.db.base import Base


class RoleType(str, Enum):
    REQUESTER = "requester"
    AGENT = "agent"
    ADMIN = "admin"
    OWNER = "owner"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    workspaces: Mapped[list["WorkspaceMember"]] = relationship(back_populates="user")

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"


class Workspace(Base):
    __tablename__ = "workspaces"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="Asia/Shanghai")
    language: Mapped[str] = mapped_column(String(10), default="zh-CN")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("users.id"), nullable=False)

    owner: Mapped["User"] = relationship(foreign_keys=[owner_id])
    members: Mapped[list["WorkspaceMember"]] = relationship(back_populates="workspace")

    def __repr__(self) -> str:
        return f"<Workspace(id={self.id}, name={self.name})>"


class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("workspaces.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("users.id"), nullable=False, index=True)
    role: Mapped[RoleType] = mapped_column(String(20), default=RoleType.REQUESTER)
    joined_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    workspace: Mapped["Workspace"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="workspaces")

    __table_args__ = (
        {"unique_constraint": ["workspace_id", "user_id"]},
    )

    def __repr__(self) -> str:
        return f"<WorkspaceMember(workspace_id={self.workspace_id}, user_id={self.user_id}, role={self.role})>"


class Permission(Base):
    __tablename__ = "permissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)

    def __repr__(self) -> str:
        return f"<Permission(id={self.id}, name={self.name})>"


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role: Mapped[str] = mapped_column(String(20), primary_key=True)
    permission_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("permissions.id"), primary_key=True)

    permission: Mapped["Permission"] = relationship()

    def __repr__(self) -> str:
        return f"<RolePermission(role={self.role}, permission_id={self.permission_id})>"


class Invitation(Base):
    __tablename__ = "invitations"

    id: Mapped[uuid.UUID] = mapped_column(UUID, primary_key=True, default=uuid.uuid4)
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("workspaces.id"), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[RoleType] = mapped_column(String(20), default=RoleType.REQUESTER)
    token: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    invited_by_id: Mapped[uuid.UUID] = mapped_column(UUID, ForeignKey("users.id"), nullable=False)

    workspace: Mapped["Workspace"] = relationship()
    invited_by: Mapped["User"] = relationship()

    def __repr__(self) -> str:
        return f"<Invitation(id={self.id}, email={self.email}, workspace_id={self.workspace_id})>"