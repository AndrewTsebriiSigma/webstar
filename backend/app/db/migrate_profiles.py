"""Manual database migration script to add location and banner_image columns."""
import sqlite3
import os

def migrate():
    # Get database path
    db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'webstar.db')
    
    print(f"Connecting to database: {db_path}")
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if columns exist
        cursor.execute("PRAGMA table_info(profiles)")
        columns = [row[1] for row in cursor.fetchall()]
        
        print(f"Current columns: {columns}")
        
        # Add location column if it doesn't exist
        if 'location' not in columns:
            print("Adding location column...")
            cursor.execute("ALTER TABLE profiles ADD COLUMN location TEXT")
            print("✅ Added location column")
        else:
            print("✓ location column already exists")
        
        # Add banner_image column if it doesn't exist
        if 'banner_image' not in columns:
            print("Adding banner_image column...")
            cursor.execute("ALTER TABLE profiles ADD COLUMN banner_image TEXT")
            print("✅ Added banner_image column")
        else:
            print("✓ banner_image column already exists")
        
        # Commit changes
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

