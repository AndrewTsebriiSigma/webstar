"""PostgreSQL migration script to add location and banner_image columns."""
import os
import psycopg2
from urllib.parse import urlparse

def migrate():
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL environment variable not set")
        return
    
    # Parse database URL
    result = urlparse(database_url)
    username = result.username
    password = result.password
    database = result.path[1:]
    hostname = result.hostname
    port = result.port or 5432
    
    print(f"Connecting to PostgreSQL database: {database} on {hostname}")
    
    # Connect to database
    conn = psycopg2.connect(
        database=database,
        user=username,
        password=password,
        host=hostname,
        port=port
    )
    
    cursor = conn.cursor()
    
    try:
        # Check if columns exist
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'profiles'
        """)
        columns = [row[0] for row in cursor.fetchall()]
        
        print(f"Current columns: {columns}")
        
        # Add location column if it doesn't exist
        if 'location' not in columns:
            print("Adding location column...")
            cursor.execute("ALTER TABLE profiles ADD COLUMN location VARCHAR")
            print("✅ Added location column")
        else:
            print("✓ location column already exists")
        
        # Add banner_image column if it doesn't exist
        if 'banner_image' not in columns:
            print("Adding banner_image column...")
            cursor.execute("ALTER TABLE profiles ADD COLUMN banner_image VARCHAR")
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
        cursor.close()
        conn.close()

if __name__ == "__main__":
    migrate()

