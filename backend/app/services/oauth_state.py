"""OAuth state management service."""
import secrets
from datetime import datetime, timedelta
from typing import Optional
from sqlmodel import Session, select
from app.db.models import OAuthState
import logging

logger = logging.getLogger(__name__)


class OAuthStateManager:
    """Manage OAuth state tokens securely in database."""
    
    @staticmethod
    def create_state(session: Session, expiration_minutes: int = 10) -> str:
        """
        Create a new OAuth state token.
        
        Args:
            session: Database session
            expiration_minutes: Minutes until state expires
        
        Returns:
            State token string
        """
        state_token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(minutes=expiration_minutes)
        
        oauth_state = OAuthState(
            state_token=state_token,
            expires_at=expires_at,
            used=False
        )
        
        session.add(oauth_state)
        session.commit()
        
        logger.info(f"Created OAuth state token (expires in {expiration_minutes}m)")
        return state_token
    
    @staticmethod
    def validate_and_consume_state(session: Session, state_token: str) -> bool:
        """
        Validate OAuth state token and mark as used.
        
        Args:
            session: Database session
            state_token: The state token to validate
        
        Returns:
            True if valid and not expired, False otherwise
        """
        if not state_token:
            logger.warning("OAuth state validation failed: empty token")
            return False
        
        # Find state token
        oauth_state = session.exec(
            select(OAuthState).where(OAuthState.state_token == state_token)
        ).first()
        
        if not oauth_state:
            logger.warning(f"OAuth state validation failed: token not found")
            return False
        
        # Check if already used
        if oauth_state.used:
            logger.warning(f"OAuth state validation failed: token already used")
            return False
        
        # Check if expired
        if datetime.utcnow() > oauth_state.expires_at:
            logger.warning(f"OAuth state validation failed: token expired")
            # Clean up expired token
            session.delete(oauth_state)
            session.commit()
            return False
        
        # Mark as used (one-time use only)
        oauth_state.used = True
        session.add(oauth_state)
        session.commit()
        
        logger.info("OAuth state validated successfully")
        return True
    
    @staticmethod
    def cleanup_expired_states(session: Session) -> int:
        """
        Clean up expired OAuth state tokens.
        
        Returns:
            Number of tokens cleaned up
        """
        expired_states = session.exec(
            select(OAuthState).where(OAuthState.expires_at < datetime.utcnow())
        ).all()
        
        count = len(expired_states)
        
        for state in expired_states:
            session.delete(state)
        
        if count > 0:
            session.commit()
            logger.info(f"Cleaned up {count} expired OAuth state tokens")
        
        return count


# Singleton instance
oauth_state_manager = OAuthStateManager()
