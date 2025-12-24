"""Test database initialization."""
import sys
sys.path.insert(0, '.')

try:
    print("Importing models...")
    from app.db.models import User, Profile, OnboardingProgress
    print("✓ Models imported successfully")
    
    print("\nImporting database...")
    from app.db.base import create_db_and_tables, engine
    print("✓ Database imported successfully")
    
    print("\nCreating tables...")
    create_db_and_tables()
    print("✓ Tables created successfully")
    
    print("\nChecking Profile table...")
    from sqlmodel import select, Session
    with Session(engine) as session:
        # Try to query profiles
        result = session.exec(select(Profile)).all()
        print(f"✓ Profile table accessible, found {len(result)} profiles")
    
    print("\n✅ All database tests passed!")
    
except Exception as e:
    print(f"\n❌ Error: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)









