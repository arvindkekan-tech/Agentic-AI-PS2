from sqlalchemy import create_engine, inspect, text
from app.db.migrations import run_schema_migrations
from app.db.session import Base
import app.models  # noqa: F401


def test_schema_migrations_adds_missing_columns():
    # Create an in-memory SQLite database
    engine = create_engine("sqlite:///:memory:")

    with engine.begin() as conn:
        # Create an old schema version of repositories table without monitoring columns
        conn.execute(text("""
            CREATE TABLE repositories (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                repo_url VARCHAR(500) NOT NULL,
                owner VARCHAR(100) NOT NULL,
                name VARCHAR(100) NOT NULL,
                branch VARCHAR(100) NOT NULL,
                analyzed_sha VARCHAR(40) NOT NULL,
                inspected_files_count INTEGER NOT NULL,
                total_files_count INTEGER NOT NULL,
                snapshot_metadata_json TEXT NOT NULL,
                created_at DATETIME NOT NULL
            );
        """))
        # Insert a dummy record to verify data preservation
        conn.execute(text("""
            INSERT INTO repositories (
                id, user_id, repo_url, owner, name, branch, analyzed_sha,
                inspected_files_count, total_files_count, snapshot_metadata_json, created_at
            ) VALUES (
                'test-id', 'user-1', 'https://github.com/test/repo', 'test', 'repo',
                'main', 'sha123', 5, 10, '{}', '2026-10-17 00:00:00'
            );
        """))

    inspector = inspect(engine)
    cols_before = {c["name"] for c in inspector.get_columns("repositories")}
    assert "last_checked_at" not in cols_before
    assert "monitoring_enabled" not in cols_before

    # Run migration
    run_schema_migrations(engine)

    # Verify columns added
    inspector_after = inspect(engine)
    cols_after = {c["name"] for c in inspector_after.get_columns("repositories")}
    assert "last_checked_at" in cols_after
    assert "last_observed_head_sha" in cols_after
    assert "monitoring_enabled" in cols_after
    assert "monitoring_interval_seconds" in cols_after

    # Verify existing record preserved
    with engine.connect() as conn:
        row = conn.execute(text("SELECT id, owner, monitoring_enabled, monitoring_interval_seconds FROM repositories WHERE id = 'test-id'")).fetchone()
        assert row is not None
        assert row[0] == "test-id"
        assert row[1] == "test"
        assert row[2] == 1  # default boolean True
        assert row[3] == 30  # default integer 30

    # Test idempotence (running second time causes no errors)
    run_schema_migrations(engine)
