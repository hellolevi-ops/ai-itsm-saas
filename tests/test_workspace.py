import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from src.main import app
from src.db.session import get_db
from src.db.base import Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_workspace.db"

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(scope="module")
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="module")
async def auth_tokens(setup_database):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        register_response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "workspace_test@example.com",
                "password": "password123",
                "full_name": "Workspace Test",
                "workspace_name": "Workspace Test Name",
            },
        )
        data = register_response.json()
        return {
            "access_token": data["tokens"]["access_token"],
            "workspace_id": str(data["workspace"]["id"]),
        }


@pytest.mark.asyncio(loop_scope="session")
async def test_get_user_workspaces(setup_database, auth_tokens):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            "/api/v1/workspaces/",
            headers={"Authorization": f"Bearer {auth_tokens['access_token']}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1


@pytest.mark.asyncio(loop_scope="session")
async def test_get_workspace(setup_database, auth_tokens):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/workspaces/{auth_tokens['workspace_id']}",
            headers={
                "Authorization": f"Bearer {auth_tokens['access_token']}",
                "X-Workspace-Id": auth_tokens["workspace_id"],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == auth_tokens["workspace_id"]


@pytest.mark.asyncio(loop_scope="session")
async def test_get_workspace_members(setup_database, auth_tokens):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(
            f"/api/v1/workspaces/{auth_tokens['workspace_id']}/members",
            headers={
                "Authorization": f"Bearer {auth_tokens['access_token']}",
                "X-Workspace-Id": auth_tokens["workspace_id"],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1


@pytest.mark.asyncio(loop_scope="session")
async def test_create_workspace(setup_database, auth_tokens):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/workspaces/",
            headers={"Authorization": f"Bearer {auth_tokens['access_token']}"},
            json={
                "name": "Second Workspace",
                "slug": "second-workspace",
                "description": "This is the second workspace",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Second Workspace"
        assert data["slug"] == "second-workspace"


@pytest.mark.asyncio(loop_scope="session")
async def test_update_workspace(setup_database, auth_tokens):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.put(
            f"/api/v1/workspaces/{auth_tokens['workspace_id']}",
            headers={
                "Authorization": f"Bearer {auth_tokens['access_token']}",
                "X-Workspace-Id": auth_tokens["workspace_id"],
            },
            json={
                "name": "Updated Workspace Name",
                "description": "Updated description",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Workspace Name"
        assert data["description"] == "Updated description"


@pytest.mark.asyncio(loop_scope="session")
async def test_delete_workspace(setup_database, auth_tokens):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        create_response = await client.post(
            "/api/v1/workspaces/",
            headers={"Authorization": f"Bearer {auth_tokens['access_token']}"},
            json={
                "name": "Delete Test Workspace",
                "slug": "delete-test-workspace",
            },
        )
        workspace_id = create_response.json()["id"]

        delete_response = await client.delete(
            f"/api/v1/workspaces/{workspace_id}",
            headers={
                "Authorization": f"Bearer {auth_tokens['access_token']}",
                "X-Workspace-Id": workspace_id,
            },
        )
        assert delete_response.status_code == 204