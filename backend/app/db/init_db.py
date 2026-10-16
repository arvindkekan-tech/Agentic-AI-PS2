from app.db.session import engine, Base
import app.models  # noqa: F401


def init_db() -> None:
    """Create all tables in the database if they do not exist."""
    Base.metadata.create_all(bind=engine)
