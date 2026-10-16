from app.db.session import engine, Base
from app.db.migrations import run_schema_migrations
import app.models  # noqa: F401


def init_db() -> None:
    """Create all tables and run idempotent schema migrations."""
    Base.metadata.create_all(bind=engine)
    run_schema_migrations(engine)

