import json
from app.db.session import SessionLocal
from app.models.user import User
from app.models.repository import Repository

db = SessionLocal()
u = db.query(User).filter(User.email == "demo@proofpath.dev").first()
if u:
    repo = db.query(Repository).filter(Repository.user_id == u.id).first()
    if not repo:
        repo = Repository(
            user_id=u.id,
            repo_url="https://github.com/demo/proofpath-backend",
            owner="demo",
            name="proofpath-backend",
            branch="main",
            analyzed_sha="a1b2c3d4e5f67890abcdef1234567890abcdef12",
            inspected_files_count=2,
            total_files_count=2,
            snapshot_metadata_json=json.dumps({
                "inspected_files": [
                    {"file_path": "app/main.py", "lines_count": 50, "language": "Python"},
                    {"file_path": "tests/test_api.py", "lines_count": 40, "language": "Python"}
                ],
                "files": {
                    "app/main.py": {"lines": ["from fastapi import FastAPI", "app = FastAPI()", "@app.get('/api')\ndef index():\n    return {'status': 'ok'}"]},
                    "tests/test_api.py": {"lines": ["import pytest", "def test_index():\n    assert True"]}
                }
            })
        )
        db.add(repo)
        db.commit()
        db.refresh(repo)
    print("DEMO_REPO_ID=" + str(repo.id))
db.close()
