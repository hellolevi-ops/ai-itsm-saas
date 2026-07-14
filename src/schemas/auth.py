import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="用户邮箱")
    password: str = Field(..., min_length=8, description="用户密码")
    full_name: str = Field(..., description="用户姓名")
    workspace_name: str = Field(..., description="工作区名称")


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="用户邮箱")
    password: str = Field(..., description="用户密码")


class TokenResponse(BaseModel):
    access_token: str = Field(..., description="访问令牌")
    refresh_token: str = Field(..., description="刷新令牌")
    token_type: str = Field("bearer", description="令牌类型")
    expires_at: datetime = Field(..., description="访问令牌过期时间")


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="刷新令牌")