"""Database connection and session management."""
from sqlmodel import SQLModel, create_engine, Session, text
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
    # PostgreSQL - production settings with proper pool management
    engine = create_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        pool_pre_ping=True,        # Verify connections before use
        pool_size=10,              # Base pool size (increased from default 5)
        max_overflow=20,           # Allow 20 additional connections (increased from 10)
        pool_timeout=30,           # Wait max 30 seconds for connection
        pool_recycle=1800,         # Recycle connections after 30 minutes
        pool_reset_on_return="rollback",  # Reset connection state on return to pool
    )


def create_db_and_tables():
    """Create database and tables."""
    SQLModel.metadata.create_all(engine)
    
    # Run migration for location and banner_image columns
    try:
        with Session(engine) as session:
            # Check if we're using PostgreSQL
            if "postgresql" in settings.DATABASE_URL or "postgres" in settings.DATABASE_URL:
                # Check if columns exist (PostgreSQL)
                result = session.exec(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'profiles' AND column_name IN ('location', 'banner_image', 'bio')
                """))
                existing_columns = [row[0] for row in result.fetchall()]
                
                # Add location column if missing
                if 'location' not in existing_columns:
                    session.exec(text("ALTER TABLE profiles ADD COLUMN location VARCHAR"))
                    session.commit()
                    print("✅ Added location column to profiles table")
                
                # Add banner_image column if missing
                if 'banner_image' not in existing_columns:
                    session.exec(text("ALTER TABLE profiles ADD COLUMN banner_image VARCHAR"))
                    session.commit()
                    print("✅ Added banner_image column to profiles table")
                
                # Add bio column if missing
                if 'bio' not in existing_columns:
                    session.exec(text("ALTER TABLE profiles ADD COLUMN bio VARCHAR(200)"))
                    session.commit()
                    print("✅ Added bio column to profiles table")
                
                # Add portfolio_customization column if missing
                result2 = session.exec(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'profiles' AND column_name = 'portfolio_customization'
                """))
                if not result2.fetchone():
                    session.exec(text("ALTER TABLE profiles ADD COLUMN portfolio_customization VARCHAR"))
                    session.commit()
                    print("✅ Added portfolio_customization column to profiles table")
                
                # Add action_buttons column if missing
                result3 = session.exec(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'profiles' AND column_name = 'action_buttons'
                """))
                if not result3.fetchone():
                    session.exec(text("ALTER TABLE profiles ADD COLUMN action_buttons VARCHAR"))
                    session.commit()
                    print("✅ Added action_buttons column to profiles table")
                
                # Add file_size column to portfolio_items if missing
                result_portfolio = session.exec(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'portfolio_items' AND column_name = 'file_size'
                """))
                if not result_portfolio.fetchone():
                    session.exec(text("ALTER TABLE portfolio_items ADD COLUMN file_size INTEGER"))
                    session.commit()
                    print("✅ Added file_size column to portfolio_items table")
            else:
                # SQLite - check if columns exist
                result = session.exec(text("PRAGMA table_info(profiles)"))
                columns = [row[1] for row in result.fetchall()]
                
                # Add location column if missing
                if 'location' not in columns:
                    session.exec(text("ALTER TABLE profiles ADD COLUMN location TEXT"))
                    session.commit()
                    print("✅ Added location column to profiles table")
                
                # Add banner_image column if missing
                if 'banner_image' not in columns:
                    session.exec(text("ALTER TABLE profiles ADD COLUMN banner_image TEXT"))
                    session.commit()
                    print("✅ Added banner_image column to profiles table")
                
                # Add bio column if missing
                if 'bio' not in columns:
                    session.exec(text("ALTER TABLE profiles ADD COLUMN bio TEXT"))
                    session.commit()
                    print("✅ Added bio column to profiles table")
                
                # Add portfolio_customization column if missing
                if 'portfolio_customization' not in columns:
                    session.exec(text("ALTER TABLE profiles ADD COLUMN portfolio_customization TEXT"))
                    session.commit()
                    print("✅ Added portfolio_customization column to profiles table")
                
                # Add action_buttons column if missing
                if 'action_buttons' not in columns:
                    session.exec(text("ALTER TABLE profiles ADD COLUMN action_buttons TEXT"))
                    session.commit()
                    print("✅ Added action_buttons column to profiles table")
                
                # Add file_size column to portfolio_items if missing
                result_portfolio = session.exec(text("PRAGMA table_info(portfolio_items)"))
                portfolio_columns = [row[1] for row in result_portfolio.fetchall()]
                if 'file_size' not in portfolio_columns:
                    session.exec(text("ALTER TABLE portfolio_items ADD COLUMN file_size INTEGER"))
                    session.commit()
                    print("✅ Added file_size column to portfolio_items table")
    except Exception as e:
        print(f"Migration note: {e}")
        # If it fails, columns might already exist
        pass


def get_session():
    """Get database session."""
    with Session(engine) as session:
        yield session

