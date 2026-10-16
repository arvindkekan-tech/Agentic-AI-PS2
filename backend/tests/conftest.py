import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.db.session import Base, get_db
from app.core.security import hash_password, create_access_token
from app.models.user import User

# In-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for every test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Override get_db and yield TestClient."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db_session):
    """Create and return a registered user."""
    user = User(
        email="developer@proofpath.dev",
        hashed_password=hash_password("password123"),
        full_name="Alex River",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user):
    """Generate authorization headers for test user."""
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def second_user(db_session):
    """Create a secondary user to test ownership barriers."""
    user = User(
        email="other@proofpath.dev",
        hashed_password=hash_password("securepass999"),
        full_name="Morgan Reed",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def second_auth_headers(second_user):
    token = create_access_token(second_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_repo_record(db_session, test_user):
    import json
    from app.models.repository import Repository
    meta = {
        "inspected_files": [
            {"path": "app/main.py", "size": 300, "lines_count": 8, "language": "Python"}
        ],
        "excluded_files": [],
        "coverage": {
            "inspected_files_count": 1,
            "excluded_files_count": 0,
            "total_files_count": 1,
            "inspected_lines_total": 8,
            "languages_detected": ["Python"],
            "limitations": ["Limited snapshot"]
        }
    }
    repo = Repository(
        user_id=test_user.id,
        repo_url="https://github.com/proofpath-org/test-repo",
        owner="proofpath-org",
        name="test-repo",
        branch="main",
        analyzed_sha="f1234567890abcdef1234567890abcdef1234567",
        inspected_files_count=1,
        total_files_count=1,
        snapshot_metadata_json=json.dumps(meta)
    )
    db_session.add(repo)
    db_session.commit()
    db_session.refresh(repo)
    return repo


@pytest.fixture
def mock_snapshot_data():
    return {
        "owner": "proofpath-org",
        "name": "test-repo",
        "branch": "main",
        "analyzed_sha": "f1234567890abcdef1234567890abcdef1234567",
        "repo_url": "https://github.com/proofpath-org/test-repo",
        "files": {
            "app/main.py": {
                "path": "app/main.py",
                "size": 300,
                "lines_count": 8,
                "language": "Python",
                "lines": [
                    "from fastapi import FastAPI",
                    "app = FastAPI(title='TestApp')",
                    "",
                    "@app.get('/items')",
                    "def read_items():",
                    "    return [{'id': 1, 'name': 'Item'}]",
                    "",
                    "# End of items endpoint"
                ]
            }
        },
        "inspected_files": [],
        "excluded_files": [],
        "coverage": None
    }

