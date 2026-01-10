#!/usr/bin/env python3
"""
Admin Panel Database Migration Script
Run this script to add admin panel tables and columns to an existing database.

Usage:
    python migrate_admin.py

For production (PostgreSQL on Render):
    1. Connect to your database via Render dashboard
    2. Or use: python migrate_admin.py
"""

import os
import sys

def run_migration():
    """Run database migration for admin panel."""
    
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///./webstar.db')
    
    print("=" * 50)
    print("Admin Panel Database Migration")
    print("=" * 50)
    print(f"Database: {database_url.split('@')[-1] if '@' in database_url else database_url}")
    print()
    
    if 'postgresql' in database_url or 'postgres' in database_url:
        # PostgreSQL migration
        try:
            import psycopg2
            
            # Render uses DATABASE_URL with postgres:// but psycopg2 needs postgresql://
            if database_url.startswith('postgres://'):
                database_url = database_url.replace('postgres://', 'postgresql://', 1)
            
            conn = psycopg2.connect(database_url)
            cursor = conn.cursor()
            
            print("📦 Adding admin columns to users table...")
            
            # Check and add columns one by one (PostgreSQL doesn't have IF NOT EXISTS for columns)
            columns_to_add = [
                ("role", "VARCHAR(20) DEFAULT 'user'"),
                ("is_banned", "BOOLEAN DEFAULT FALSE"),
                ("banned_at", "TIMESTAMP"),
                ("banned_by", "INTEGER"),
                ("ban_reason", "TEXT"),
            ]
            
            for col_name, col_type in columns_to_add:
                try:
                    cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
                    print(f"  ✅ Added column: {col_name}")
                except psycopg2.errors.DuplicateColumn:
                    print(f"  ⏭️  Column exists: {col_name}")
                    conn.rollback()
            
            conn.commit()
            
            print("\n📦 Creating reports table...")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS reports (
                    id SERIAL PRIMARY KEY,
                    reporter_id INTEGER REFERENCES users(id),
                    reporter_ip VARCHAR(45),
                    target_type VARCHAR(50) NOT NULL,
                    target_id INTEGER NOT NULL,
                    target_user_id INTEGER NOT NULL REFERENCES users(id),
                    reason VARCHAR(50) NOT NULL,
                    description TEXT,
                    status VARCHAR(20) DEFAULT 'pending',
                    resolved_by INTEGER REFERENCES users(id),
                    resolved_at TIMESTAMP,
                    resolution_note TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("  ✅ Reports table ready")
            
            print("\n📦 Creating admin_actions table...")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS admin_actions (
                    id SERIAL PRIMARY KEY,
                    admin_id INTEGER NOT NULL REFERENCES users(id),
                    action_type VARCHAR(50) NOT NULL,
                    target_type VARCHAR(50) NOT NULL,
                    target_id INTEGER NOT NULL,
                    details TEXT,
                    ip_address VARCHAR(45),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            print("  ✅ Admin actions table ready")
            
            print("\n📦 Creating indexes...")
            indexes = [
                ("idx_users_role", "users(role)"),
                ("idx_reports_status", "reports(status)"),
                ("idx_reports_target_type", "reports(target_type)"),
                ("idx_admin_actions_admin_id", "admin_actions(admin_id)"),
            ]
            for idx_name, idx_cols in indexes:
                try:
                    cursor.execute(f"CREATE INDEX IF NOT EXISTS {idx_name} ON {idx_cols}")
                except:
                    pass
            print("  ✅ Indexes created")
            
            conn.commit()
            cursor.close()
            conn.close()
            
            print("\n" + "=" * 50)
            print("✅ PostgreSQL migration complete!")
            print("=" * 50)
            
        except ImportError:
            print("❌ psycopg2 not installed. Install with: pip install psycopg2-binary")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            sys.exit(1)
    
    else:
        # SQLite migration
        import sqlite3
        
        db_path = database_url.replace('sqlite:///', '')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        print("📦 Adding admin columns to users table...")
        
        columns = [
            ('role', 'TEXT DEFAULT "user"'),
            ('is_banned', 'INTEGER DEFAULT 0'),
            ('banned_at', 'TEXT'),
            ('banned_by', 'INTEGER'),
            ('ban_reason', 'TEXT'),
        ]
        
        for col_name, col_type in columns:
            try:
                cursor.execute(f'ALTER TABLE users ADD COLUMN {col_name} {col_type}')
                print(f"  ✅ Added column: {col_name}")
            except sqlite3.OperationalError as e:
                if 'duplicate column' in str(e).lower():
                    print(f"  ⏭️  Column exists: {col_name}")
                else:
                    raise
        
        print("\n📦 Creating reports table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reporter_id INTEGER,
                reporter_ip TEXT,
                target_type TEXT NOT NULL,
                target_id INTEGER NOT NULL,
                target_user_id INTEGER NOT NULL,
                reason TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'pending',
                resolved_by INTEGER,
                resolved_at TEXT,
                resolution_note TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (reporter_id) REFERENCES users(id),
                FOREIGN KEY (target_user_id) REFERENCES users(id),
                FOREIGN KEY (resolved_by) REFERENCES users(id)
            )
        ''')
        print("  ✅ Reports table ready")
        
        print("\n📦 Creating admin_actions table...")
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS admin_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                admin_id INTEGER NOT NULL,
                action_type TEXT NOT NULL,
                target_type TEXT NOT NULL,
                target_id INTEGER NOT NULL,
                details TEXT,
                ip_address TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_id) REFERENCES users(id)
            )
        ''')
        print("  ✅ Admin actions table ready")
        
        conn.commit()
        conn.close()
        
        print("\n" + "=" * 50)
        print("✅ SQLite migration complete!")
        print("=" * 50)


if __name__ == '__main__':
    run_migration()
