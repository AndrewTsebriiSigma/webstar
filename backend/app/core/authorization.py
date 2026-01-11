"""Authorization helpers for resource ownership verification.

Provides centralized authorization checks to prevent IDOR vulnerabilities.
"""
from fastapi import HTTPException, status
from app.db.models import User
import logging

logger = logging.getLogger(__name__)


class AuthorizationError(HTTPException):
    """Custom exception for authorization failures."""
    def __init__(self, detail: str = "Access denied"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


def verify_ownership(
    resource_owner_id: int,
    current_user: User,
    resource_type: str = "resource"
) -> None:
    """
    Verify user owns the resource.
    
    Args:
        resource_owner_id: ID of the user who owns the resource
        current_user: Currently authenticated user
        resource_type: Type of resource for error message
    
    Raises:
        AuthorizationError: If user doesn't own the resource
    """
    if current_user.id != resource_owner_id:
        logger.warning(
            f"Authorization failed: User {current_user.id} attempted to access "
            f"{resource_type} owned by {resource_owner_id}"
        )
        raise AuthorizationError(
            detail=f"You don't have permission to access this {resource_type}"
        )


def verify_ownership_or_admin(
    resource_owner_id: int,
    current_user: User,
    resource_type: str = "resource"
) -> bool:
    """
    Verify user owns resource OR is an admin.
    
    Args:
        resource_owner_id: ID of the user who owns the resource
        current_user: Currently authenticated user
        resource_type: Type of resource for error message
    
    Returns:
        True if authorized
        
    Raises:
        AuthorizationError: If user doesn't have access
    """
    # Admins and super_admins can access any resource
    if current_user.role in ["admin", "super_admin"]:
        return True
    
    # Otherwise, must be the owner
    if current_user.id != resource_owner_id:
        logger.warning(
            f"Authorization failed: User {current_user.id} (role: {current_user.role}) "
            f"attempted to access {resource_type} owned by {resource_owner_id}"
        )
        raise AuthorizationError(
            detail=f"You don't have permission to access this {resource_type}"
        )
    
    return True


def verify_ownership_or_moderator(
    resource_owner_id: int,
    current_user: User,
    resource_type: str = "resource"
) -> bool:
    """
    Verify user owns resource OR is a moderator/admin.
    
    Args:
        resource_owner_id: ID of the user who owns the resource
        current_user: Currently authenticated user
        resource_type: Type of resource for error message
    
    Returns:
        True if authorized
        
    Raises:
        AuthorizationError: If user doesn't have access
    """
    # Moderators, admins, and super_admins can access
    if current_user.role in ["moderator", "admin", "super_admin"]:
        return True
    
    # Otherwise, must be the owner
    if current_user.id != resource_owner_id:
        logger.warning(
            f"Authorization failed: User {current_user.id} (role: {current_user.role}) "
            f"attempted to access {resource_type} owned by {resource_owner_id}"
        )
        raise AuthorizationError(
            detail=f"You don't have permission to access this {resource_type}"
        )
    
    return True


def require_role(
    current_user: User,
    required_roles: list[str],
    action: str = "perform this action"
) -> None:
    """
    Require user to have one of the specified roles.
    
    Args:
        current_user: Currently authenticated user
        required_roles: List of allowed roles
        action: Action being performed (for error message)
    
    Raises:
        AuthorizationError: If user doesn't have required role
    """
    if current_user.role not in required_roles:
        logger.warning(
            f"Authorization failed: User {current_user.id} (role: {current_user.role}) "
            f"attempted to {action}. Required roles: {required_roles}"
        )
        raise AuthorizationError(
            detail=f"Insufficient permissions to {action}"
        )


def check_not_banned(current_user: User) -> None:
    """
    Check that user is not banned.
    
    Args:
        current_user: Currently authenticated user
    
    Raises:
        AuthorizationError: If user is banned
    """
    if current_user.is_banned:
        logger.warning(f"Banned user {current_user.id} attempted to access resource")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been banned. Please contact support."
        )
