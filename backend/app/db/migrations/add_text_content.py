"""Add text_content field to portfolio_items table for text posts."""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def migrate():
    """Add text_content column and make content_url nullable."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ DATABASE_URL not found in environment")
        return
    
    try:
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("🔄 Adding text_content column to portfolio_items...")
        
        # Add text_content column
        cursor.execute("""
            ALTER TABLE portfolio_items 
            ADD COLUMN IF NOT EXISTS text_content VARCHAR(500);
        """)
        
        # Make content_url nullable
        cursor.execute("""
            ALTER TABLE portfolio_items 
            ALTER COLUMN content_url DROP NOT NULL;
        """)
        
        conn.commit()
        print("✅ Migration completed successfully!")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    migrate()

