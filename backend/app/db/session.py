from typing import Generator, Dict, Any
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from sqlalchemy.pool import QueuePool, NullPool

from app.core.config import settings

def get_normalized_database_url(raw_url: str) -> str:
    """Ensure standard PostgreSQL driver prefix for SQLAlchemy."""
    url = raw_url.strip()
    if url.startswith("postgres://"):
        url = "postgresql+psycopg2://" + url[len("postgres://"):]
    elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url

db_url = get_normalized_database_url(settings.DATABASE_URL)

engine_kwargs: Dict[str, Any] = {
    "echo": False,
    "future": True,
}

connect_args: Dict[str, Any] = {}

if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    engine_kwargs["connect_args"] = connect_args
else:
    # PostgreSQL (Local or Supabase)
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_timeout"] = 30
    engine_kwargs["pool_recycle"] = 1800

    # If connecting to Supabase cloud instance without explicit sslmode, enforce require
    if "supabase.co" in db_url and "sslmode" not in db_url:
        connect_args["sslmode"] = "require"
    
    if connect_args:
        engine_kwargs["connect_args"] = connect_args

engine = create_engine(db_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency that provides an active database session and ensures cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
