"""Add profile_setup_completed to users table

This migration adds the profile_setup_completed column to support OAuth user flow.

Run this script manually:
  python -m app.db.migrations.add_profile_setup_completed

"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from app.core.config import settings


def upgrade():
    """Add profile_setup_completed column to users table."""
    engine = create_engine(str(settings.DATABASE_URL))
    
    with engine.connect() as connection:
        # Start transaction
        trans = connection.begin()
        
        try:
            # Check if column already exists
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='profile_setup_completed';
            """))
            
            if result.fetchone():
                print("✓ Column 'profile_setup_completed' already exists. Skipping.")
                trans.commit()
                return
            
            # Add the column with default value TRUE
            connection.execute(text("""
                ALTER TABLE users 
                ADD COLUMN profile_setup_completed BOOLEAN DEFAULT TRUE NOT NULL;
            """))
            
            print("✓ Added column 'profile_setup_completed' to 'users' table")
            
            # Update existing OAuth users with temp usernames to FALSE
            result = connection.execute(text("""
                UPDATE users 
                SET profile_setup_completed = FALSE 
                WHERE oauth_provider = 'google' 
                AND username LIKE 'temp_%';
            """))
            
            updated_count = result.rowcount
            print(f"✓ Updated {updated_count} OAuth user(s) with temp usernames to profile_setup_completed=FALSE")
            
            # Commit transaction
            trans.commit()
            print("✓ Migration completed successfully!")
            
        except Exception as e:
            trans.rollback()
            print(f"✗ Migration failed: {str(e)}")
            raise


def downgrade():
    """Remove profile_setup_completed column from users table."""
    engine = create_engine(str(settings.DATABASE_URL))
    
    with engine.connect() as connection:
        trans = connection.begin()
        
        try:
            connection.execute(text("""
                ALTER TABLE users 
                DROP COLUMN IF EXISTS profile_setup_completed;
            """))
            
            trans.commit()
            print("✓ Removed column 'profile_setup_completed' from 'users' table")
            
        except Exception as e:
            trans.rollback()
            print(f"✗ Rollback failed: {str(e)}")
            raise


if __name__ == "__main__":
    print("Running migration: add_profile_setup_completed")
    print("=" * 50)
    upgrade()
    print("=" * 50)

