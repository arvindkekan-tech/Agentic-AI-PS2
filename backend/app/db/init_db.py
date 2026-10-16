from sqlalchemy import text
from app.db.session import engine, Base
import app.models  # noqa: F401


def init_db() -> None:
    """Create all tables in the database if they do not exist and apply schema migrations."""
    Base.metadata.create_all(bind=engine)

    # Apply incremental migrations for SQLite
    with engine.connect() as conn:
        # Check columns in assessments table
        try:
            result = conn.execute(text("PRAGMA table_info(assessments)"))
            existing_cols = {row[1] for row in result.fetchall()}
            
            new_assessment_cols = [
                ("compatibility_score", "FLOAT DEFAULT 0.0"),
                ("evidence_coverage", "FLOAT DEFAULT 0.0"),
                ("evidence_match_score", "FLOAT DEFAULT 0.0"),
                ("resume_alignment_score", "FLOAT DEFAULT 0.0"),
                ("scoring_metadata_json", "TEXT DEFAULT '{}'"),
                ("recommendations_json", "TEXT DEFAULT '[]'"),
                ("alignment_matrix_json", "TEXT DEFAULT '[]'"),
                ("file_findings_json", "TEXT DEFAULT '[]'"),
            ]

            for col_name, col_type in new_assessment_cols:
                if col_name not in existing_cols:
                    conn.execute(text(f"ALTER TABLE assessments ADD COLUMN {col_name} {col_type}"))

            # Check columns in requirement_assessments table
            req_result = conn.execute(text("PRAGMA table_info(requirement_assessments)"))
            req_cols = {row[1] for row in req_result.fetchall()}
            if "weight" not in req_cols:
                conn.execute(text("ALTER TABLE requirement_assessments ADD COLUMN weight INTEGER DEFAULT 2"))

            conn.commit()
        except Exception:
            # Table might not exist yet during initial metadata creation, which is normal
            pass
