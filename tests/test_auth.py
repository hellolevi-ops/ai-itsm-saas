import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from src.main import app
from src.db.base import Base
from src.db.session import get_db

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="module")
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.mark.asyncio(loop_scope="session")
async def test_register_success(setup_database):
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "password123",
                "full_name": "Test User",
                "workspace_name": "Test Workspace",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "user" in data
        assert "workspace" in data
        assert "tokens" in data
        assert data["user"]["email"] == "test@example.com"
        assert data["workspace"]["name"] == "Test Workspace"


@pytest.mark.asyncio(loop_scope="session")
async def test_register_duplicate_email(setup_database):
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "password123",
                "full_name": "Test User",
                "workspace_name": "Test Workspace",
            },
        )
        assert response.status_code == 400
        assert response.json()["error"]["message"] == "邮箱已被注册"


@pytest.mark.asyncio(loop_scope="session")
async def test_login_success(setup_database):
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"


@pytest.mark.asyncio(loop_scope="session")
async def test_login_invalid_password(setup_database):
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == 401
        assert response.json()["error"]["message"] == "邮箱或密码错误"


@pytest.mark.asyncio(loop_scope="session")
async def test_login_nonexistent_user(setup_database):
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == 401
        assert response.json()["error"]["message"] == "邮箱或密码错误"