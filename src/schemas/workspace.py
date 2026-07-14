import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class WorkspaceCreate(BaseModel):
    name: str = Field(..., description="工作区名称")
    slug: str = Field(..., description="工作区别名（用于子域名）")
    description: str = Field(None, description="工作区描述")
    timezone: str = Field("Asia/Shanghai", description="时区")
    language: str = Field("zh-CN", description="语言")


class WorkspaceUpdate(BaseModel):
    name: str = Field(None, description="工作区名称")
    description: str = Field(None, description="工作区描述")
    timezone: str = Field(None, description="时区")
    language: str = Field(None, description="语言")


class WorkspaceResponse(BaseModel):
    id: uuid.UUID = Field(..., description="工作区ID")
    name: str = Field(..., description="工作区名称")
    slug: str = Field(..., description="工作区别名")
    description: str | None = Field(None, description="工作区描述")
    timezone: str = Field(..., description="时区")
    language: str = Field(..., description="语言")
    is_active: bool = Field(..., description="是否活跃")
    owner_id: uuid.UUID = Field(..., description="所有者ID")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime = Field(..., description="更新时间")

    model_config = {"from_attributes": True}


class WorkspaceMemberResponse(BaseModel):
    id: uuid.UUID = Field(..., description="成员ID")
    user_id: uuid.UUID = Field(..., description="用户ID")
    role: str = Field(..., description="角色")
    joined_at: datetime = Field(..., description="加入时间")
    is_active: bool = Field(..., description="是否活跃")

    model_config = {"from_attributes": True}