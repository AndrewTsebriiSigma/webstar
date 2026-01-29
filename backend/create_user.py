#!/usr/bin/env python3
"""
Create New User Script
Creates a new user account and sends the password via email.

Usage:
    python create_user.py <email> <username> [full_name]

Examples:
    python create_user.py user@example.com johndoe
    python create_user.py user@example.com johndoe "John Doe"
"""

import os
import sys
import secrets
import string
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent))

from app.db.base import get_session, create_db_and_tables
from app.db.models import User, Profile, OnboardingProgress, UserPoints
from app.core.security import get_password_hash
# Email service import - optional
try:
    from app.services.email_service import send_welcome_email
except ImportError:
    send_welcome_email = None
from sqlmodel import Session, select
from sqlalchemy import func


def generate_secure_password(length: int = 12) -> str:
    """Generate a secure random password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    # Ensure password has at least one of each type
    if not any(c.islower() for c in password):
        password = password[:-1] + secrets.choice(string.ascii_lowercase)
    if not any(c.isupper() for c in password):
        password = password[:-1] + secrets.choice(string.ascii_uppercase)
    if not any(c.isdigit() for c in password):
        password = password[:-1] + secrets.choice(string.digits)
    return password


def create_user(email: str, username: str, full_name: str = None):
    """Create a new user and send password via email."""
    
    print("=" * 50)
    print("Create New User")
    print("=" * 50)
    
    # Initialize database
    create_db_and_tables()
    
    # Get database session
    session_gen = get_session()
    session: Session = next(session_gen)
    
    try:
        # Check if email already exists
        existing_email = session.exec(
            select(User).where(func.lower(User.email) == func.lower(email))
        ).first()
        
        if existing_email:
            print(f"❌ Error: Email '{email}' is already registered")
            print(f"   Existing user: {existing_email.username}")
            return False
        
        # Check if username already exists
        existing_username = session.exec(
            select(User).where(User.username == username.lower())
        ).first()
        
        if existing_username:
            print(f"❌ Error: Username '{username}' is already taken")
            return False
        
        # Generate secure password
        password = generate_secure_password(12)
        hashed_password = get_password_hash(password)
        
        # Create user
        user = User(
            email=email.lower(),
            username=username.lower(),
            hashed_password=hashed_password,
            full_name=full_name or username,
            is_active=True,
            profile_setup_completed=True
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        
        # Create profile
        profile = Profile(
            user_id=user.id,
            display_name=full_name or username
        )
        session.add(profile)
        
        # Create onboarding progress
        onboarding = OnboardingProgress(user_id=user.id)
        session.add(onboarding)
        
        # Create points account
        points = UserPoints(user_id=user.id)
        session.add(points)
        
        session.commit()
        
        print(f"✅ User created successfully!")
        print(f"   ID: {user.id}")
        print(f"   Email: {user.email}")
        print(f"   Username: {user.username}")
        print(f"   Full Name: {user.full_name}")
        print(f"   Password: {password}")
        print()
        
        # Send welcome email (if available)
        if send_welcome_email:
            print("📧 Sending welcome email...")
            if send_welcome_email(user.email, user.username, password, user.full_name):
                print(f"✅ Welcome email sent successfully to {user.email}")
            else:
                print(f"⚠️  Warning: Failed to send welcome email to {user.email}")
                print(f"   Password: {password}")
                print(f"   Please share this password with the user manually.")
        else:
            print(f"📧 Email service not available. Password displayed above.")
        
        print()
        print("=" * 50)
        print("🎉 User creation complete!")
        print("=" * 50)
        
        return True
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error creating user: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        session.close()


if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python create_user.py <email> <username> [full_name]")
        print("Example: python create_user.py user@example.com johndoe")
        print("Example: python create_user.py user@example.com johndoe 'John Doe'")
        sys.exit(1)
    
    email = sys.argv[1]
    username = sys.argv[2]
    full_name = sys.argv[3] if len(sys.argv) > 3 else None
    
    success = create_user(email, username, full_name)
    sys.exit(0 if success else 1)
