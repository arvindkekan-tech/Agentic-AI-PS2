import logging
from sqlalchemy import inspect, text, Engine
from app.db.session import Base

logger = logging.getLogger(__name__)


def get_column_ddl_type(column) -> str:
    """Return SQL DDL type string for a SQLAlchemy column."""
    col_type = str(column.type).upper()
    if "VARCHAR" in col_type or "STRING" in col_type:
        return f"VARCHAR({getattr(column.type, 'length', 255) or 255})"
    elif "TEXT" in col_type:
        return "TEXT"
    elif "BOOLEAN" in col_type:
        return "BOOLEAN"
    elif "INTEGER" in col_type:
        return "INTEGER"
    elif "DATETIME" in col_type or "TIMESTAMP" in col_type:
        return "DATETIME"
    return col_type


def run_schema_migrations(engine: Engine) -> None:
    """
    Idempotent schema migration runner.
    Compares live database tables against current SQLAlchemy models.
    Safely executes ALTER TABLE ADD COLUMN for any missing columns,
    preserving all existing records and relationships.
    """
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as conn:
        for table_name, table in Base.metadata.tables.items():
            if table_name not in existing_tables:
                continue

            existing_columns = {col["name"] for col in inspector.get_columns(table_name)}

            for col in table.columns:
                if col.name not in existing_columns:
                    ddl_type = get_column_ddl_type(col)
                    default_clause = ""

                    if col.default is not None:
                        arg = col.default.arg
                        if isinstance(arg, bool):
                            default_clause = f" DEFAULT {'1' if arg else '0'}"
                        elif isinstance(arg, (int, float)):
                            default_clause = f" DEFAULT {arg}"
                        elif isinstance(arg, str):
                            default_clause = f" DEFAULT '{arg}'"
                    elif not col.nullable:
                        if "BOOLEAN" in ddl_type:
                            default_clause = " DEFAULT 1"
                        elif "INT" in ddl_type:
                            default_clause = " DEFAULT 0"
                        elif "VARCHAR" in ddl_type or "TEXT" in ddl_type:
                            default_clause = " DEFAULT ''"

                    alter_query = f"ALTER TABLE {table_name} ADD COLUMN {col.name} {ddl_type}{default_clause}"
                    logger.info(f"Applying schema migration: {alter_query}")
                    conn.execute(text(alter_query))
                    existing_columns.add(col.name)
