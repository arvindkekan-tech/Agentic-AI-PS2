from app.db.session import engine, Base, SessionLocal
from app.db.migrations import run_schema_migrations
from app.models.user import User
from app.core.security import hash_password
import app.models  # noqa: F401


def seed_demo_user(db_session=None) -> None:
    """Ensure demo user is provisioned for testing and demo quick-fill."""
    if db_session is not None:
        user = db_session.query(User).filter(User.email == "demo@proofpath.dev").first()
        if not user:
            demo_user = User(
                email="demo@proofpath.dev",
                hashed_password=hash_password("ProofPath2026!"),
                full_name="ProofPath Demo Candidate",
                is_active=True
            )
            db_session.add(demo_user)
            db_session.commit()
        return

    with SessionLocal() as db:
        user = db.query(User).filter(User.email == "demo@proofpath.dev").first()
        if not user:
            demo_user = User(
                email="demo@proofpath.dev",
                hashed_password=hash_password("ProofPath2026!"),
                full_name="ProofPath Demo Candidate",
                is_active=True
            )
            db.add(demo_user)
            db.commit()


def init_db() -> None:
    """Create all tables, run idempotent schema migrations, and seed demo user."""
    Base.metadata.create_all(bind=engine)
    run_schema_migrations(engine)
    seed_demo_user()

