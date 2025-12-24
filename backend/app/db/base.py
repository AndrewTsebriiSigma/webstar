"""Database connection and session management."""
from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

# Create engine with improved SQLite concurrency handling
if "sqlite" in settings.DATABASE_URL:
    connect_args = {
        "check_same_thread": False,
        "timeout": 20.0,  # 20 second timeout for database operations
    }
    # Enable WAL mode for better concurrency (requires SQLite 3.7.0+)
    # This will be set after connection if needed
    engine = create_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        connect_args=connect_args,
        pool_pre_ping=True,  # Verify connections before using
    )
    # Enable WAL mode programmatically for better concurrent read access
    from sqlalchemy import event
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_conn, connection_record):
        try:
            cursor = dbapi_conn.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA busy_timeout=20000")  # 20 second busy timeout
            cursor.close()
        except Exception:
            # If WAL mode fails, continue without it (fallback to default)
            pass
else:
    engine = create_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        pool_pre_ping=True,
    )


def create_db_and_tables():
    """Create database and tables."""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Get database session."""
    with Session(engine) as session:
        yield session

