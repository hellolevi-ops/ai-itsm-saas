import uuid

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.schemas.workspace import WorkspaceCreate, WorkspaceUpdate, WorkspaceResponse, WorkspaceMemberResponse
from src.services.workspace_service import WorkspaceService
from src.middleware.auth import get_current_user, get_tenant_context, require_workspace_admin, require_workspace_owner
from src.db.session import get_db

router = APIRouter(prefix="/api/v1/workspaces", tags=["workspaces"])


@router.get("/", response_model=list[WorkspaceResponse])
async def get_user_workspaces(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace_service = WorkspaceService(db)
    workspaces = await workspace_service.get_user_workspaces(current_user["id"])
    return workspaces


@router.get("/{workspace_id}", response_model=WorkspaceResponse)
async def get_workspace(
    workspace_id: uuid.UUID,
    tenant_context: dict = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    workspace_service = WorkspaceService(db)
    workspace = await workspace_service.get_workspace(workspace_id)
    return workspace


@router.post("/", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    request: WorkspaceCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    workspace_service = WorkspaceService(db)
    workspace = await workspace_service.create_workspace(
        name=request.name,
        slug=request.slug,
        owner_id=current_user["id"],
        description=request.description,
        timezone=request.timezone,
        language=request.language,
    )
    return workspace


@router.put("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: uuid.UUID,
    request: WorkspaceUpdate,
    tenant_context: dict = Depends(require_workspace_admin),
    db: AsyncSession = Depends(get_db),
):
    update_data = {k: v for k, v in request.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="没有提供更新数据"
        )

    workspace_service = WorkspaceService(db)
    workspace = await workspace_service.update_workspace(
        workspace_id=workspace_id,
        user_id=tenant_context["user"]["id"],
        **update_data,
    )
    return workspace


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: uuid.UUID,
    tenant_context: dict = Depends(require_workspace_owner),
    db: AsyncSession = Depends(get_db),
):
    workspace_service = WorkspaceService(db)
    await workspace_service.delete_workspace(
        workspace_id=workspace_id,
        user_id=tenant_context["user"]["id"],
    )
    return None


@router.get("/{workspace_id}/members", response_model=list[WorkspaceMemberResponse])
async def get_workspace_members(
    workspace_id: uuid.UUID,
    tenant_context: dict = Depends(get_tenant_context),
    db: AsyncSession = Depends(get_db),
):
    workspace_service = WorkspaceService(db)
    members = await workspace_service.get_workspace_members(workspace_id)
    return members