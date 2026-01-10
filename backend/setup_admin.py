#!/usr/bin/env python3
"""
Setup First Super Admin Script
Run this script after migration to create the first super admin.

Usage:
    python setup_admin.py <user_id_or_email>

Examples:
    python setup_admin.py 1
    python setup_admin.py andriitsebrii@gmail.com
"""

import os
import sys

def setup_admin(user_identifier: str):
    """Set up a user as super_admin."""
    
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///./webstar.db')
    
    print("=" * 50)
    print("Super Admin Setup")
    print("=" * 50)
    
    if 'postgresql' in database_url or 'postgres' in database_url:
        try:
            import psycopg2
            
            if database_url.startswith('postgres://'):
                database_url = database_url.replace('postgres://', 'postgresql://', 1)
            
            conn = psycopg2.connect(database_url)
            cursor = conn.cursor()
            
            # Check if any super_admin exists
            cursor.execute("SELECT id, username, email FROM users WHERE role = 'super_admin'")
            existing = cursor.fetchone()
            
            if existing:
                print(f"⚠️  Super admin already exists:")
                print(f"   ID: {existing[0]}, Username: {existing[1]}, Email: {existing[2]}")
                print("\nTo add another admin, use the admin panel or API.")
                return
            
            # Find user by ID or email
            if user_identifier.isdigit():
                cursor.execute("SELECT id, username, email FROM users WHERE id = %s", (int(user_identifier),))
            else:
                cursor.execute("SELECT id, username, email FROM users WHERE LOWER(email) = LOWER(%s)", (user_identifier,))
            
            user = cursor.fetchone()
            
            if not user:
                print(f"❌ User not found: {user_identifier}")
                print("\nAvailable users:")
                cursor.execute("SELECT id, username, email FROM users LIMIT 10")
                for u in cursor.fetchall():
                    print(f"   ID: {u[0]}, Username: {u[1]}, Email: {u[2]}")
                return
            
            # Promote to super_admin
            cursor.execute("UPDATE users SET role = 'super_admin' WHERE id = %s", (user[0],))
            conn.commit()
            
            print(f"✅ User promoted to super_admin:")
            print(f"   ID: {user[0]}")
            print(f"   Username: {user[1]}")
            print(f"   Email: {user[2]}")
            print(f"   Role: super_admin")
            
            cursor.close()
            conn.close()
            
        except ImportError:
            print("❌ psycopg2 not installed. Install with: pip install psycopg2-binary")
            sys.exit(1)
    
    else:
        # SQLite
        import sqlite3
        
        db_path = database_url.replace('sqlite:///', '')
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if any super_admin exists
        cursor.execute("SELECT id, username, email FROM users WHERE role = 'super_admin'")
        existing = cursor.fetchone()
        
        if existing:
            print(f"⚠️  Super admin already exists:")
            print(f"   ID: {existing[0]}, Username: {existing[1]}, Email: {existing[2]}")
            return
        
        # Find user
        if user_identifier.isdigit():
            cursor.execute("SELECT id, username, email FROM users WHERE id = ?", (int(user_identifier),))
        else:
            cursor.execute("SELECT id, username, email FROM users WHERE LOWER(email) = LOWER(?)", (user_identifier,))
        
        user = cursor.fetchone()
        
        if not user:
            print(f"❌ User not found: {user_identifier}")
            return
        
        # Promote
        cursor.execute("UPDATE users SET role = 'super_admin' WHERE id = ?", (user[0],))
        conn.commit()
        
        print(f"✅ User promoted to super_admin:")
        print(f"   ID: {user[0]}")
        print(f"   Username: {user[1]}")
        print(f"   Email: {user[2]}")
        
        conn.close()
    
    print("\n" + "=" * 50)
    print("🎉 Setup complete! You can now access /admin")
    print("=" * 50)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python setup_admin.py <user_id_or_email>")
        print("Example: python setup_admin.py andriitsebrii@gmail.com")
        sys.exit(1)
    
    setup_admin(sys.argv[1])
