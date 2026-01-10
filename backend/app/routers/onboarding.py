"""Onboarding router."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db.base import get_session
from app.db.models import User, OnboardingProgress, Profile, PointsTransaction, UserPoints
from app.deps.auth import get_current_user
from app.schemas.onboarding import (
    ArchetypeSelection, RoleSelection, ExpertiseSelection,
    OnboardingStatus, CompleteOnboarding
)

router = APIRouter()

# Points for onboarding completion
ONBOARDING_POINTS = {
    "archetype": 15,
    "role": 15,
    "expertise": 20,
    "completion": 50
}


async def award_points(user_id: int, action: str, points: int, session: Session):
    """Award points to user."""
    # Add transaction
    transaction = PointsTransaction(
        user_id=user_id,
        points=points,
        action=action,
        description=f"Completed {action}"
    )
    session.add(transaction)
    
    # Update balance
    user_points = session.exec(select(UserPoints).where(UserPoints.user_id == user_id)).first()
    if user_points:
        user_points.total_points += points
        user_points.available_points += points
        session.add(user_points)
    
    session.commit()


@router.get("/status", response_model=OnboardingStatus)
async def get_onboarding_status(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get user's onboarding status."""
    onboarding = session.exec(
        select(OnboardingProgress).where(OnboardingProgress.user_id == current_user.id)
    ).first()
    
    if not onboarding:
        # Create if doesn't exist
        onboarding = OnboardingProgress(user_id=current_user.id)
        session.add(onboarding)
        session.commit()
        session.refresh(onboarding)
    
    return OnboardingStatus(
        archetype=onboarding.archetype,
        role=onboarding.role,
        expertise_level=onboarding.expertise_level,
        completed=onboarding.completed,
        completed_at=onboarding.completed_at.isoformat() if onboarding.completed_at else None
    )


@router.post("/archetype")
async def set_archetype(
    data: ArchetypeSelection,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Set user's archetype."""
    # Validate archetype
    valid_archetypes = ["Engineer", "Artist", "Sound-Maker", "Communicator"]
    if data.archetype not in valid_archetypes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid archetype. Must be one of: {', '.join(valid_archetypes)}"
        )
    
    # Get or create onboarding progress
    onboarding = session.exec(
        select(OnboardingProgress).where(OnboardingProgress.user_id == current_user.id)
    ).first()
    
    if not onboarding:
        onboarding = OnboardingProgress(user_id=current_user.id)
    
    # Award points if this is the first time
    if not onboarding.archetype:
        await award_points(current_user.id, "archetype_selection", ONBOARDING_POINTS["archetype"], session)
    
    onboarding.archetype = data.archetype
    onboarding.updated_at = datetime.utcnow()
    
    session.add(onboarding)
    session.commit()
    
    return {"message": "Archetype set successfully", "archetype": data.archetype}


@router.post("/role")
async def set_role(
    data: RoleSelection,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Set user's role."""
    # Get or create onboarding progress
    onboarding = session.exec(
        select(OnboardingProgress).where(OnboardingProgress.user_id == current_user.id)
    ).first()
    
    if not onboarding:
        onboarding = OnboardingProgress(user_id=current_user.id)
    
    # Award points if this is the first time
    if not onboarding.role:
        await award_points(current_user.id, "role_selection", ONBOARDING_POINTS["role"], session)
    
    onboarding.role = data.role
    onboarding.updated_at = datetime.utcnow()
    
    session.add(onboarding)
    
    # Update profile with role
    profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
    if profile:
        profile.role = data.role
        session.add(profile)
    
    session.commit()
    
    return {"message": "Role set successfully", "role": data.role}


@router.post("/expertise")
async def set_expertise(
    data: ExpertiseSelection,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Set user's expertise level."""
    # Get or create onboarding progress
    onboarding = session.exec(
        select(OnboardingProgress).where(OnboardingProgress.user_id == current_user.id)
    ).first()
    
    if not onboarding:
        onboarding = OnboardingProgress(user_id=current_user.id)
    
    # Award points if this is the first time
    if not onboarding.expertise_level:
        await award_points(current_user.id, "expertise_selection", ONBOARDING_POINTS["expertise"], session)
    
    onboarding.expertise_level = data.expertise_level
    onboarding.updated_at = datetime.utcnow()
    
    session.add(onboarding)
    
    # Update profile with expertise badge
    profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
    if profile:
        profile.expertise_badge = data.expertise_level
        session.add(profile)
    
    session.commit()
    
    return {"message": "Expertise level set successfully", "expertise_level": data.expertise_level}


@router.post("/complete")
async def complete_onboarding(
    data: CompleteOnboarding,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Complete onboarding in one request."""
    # Validate archetype
    valid_archetypes = ["Engineer", "Artist", "Sound-Maker", "Communicator"]
    if data.archetype not in valid_archetypes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid archetype. Must be one of: {', '.join(valid_archetypes)}"
        )
    
    # Get or create onboarding progress
    onboarding = session.exec(
        select(OnboardingProgress).where(OnboardingProgress.user_id == current_user.id)
    ).first()
    
    if not onboarding:
        onboarding = OnboardingProgress(user_id=current_user.id)
    
    # Award points for each new step
    total_points = 0
    if not onboarding.archetype:
        total_points += ONBOARDING_POINTS["archetype"]
    if not onboarding.role:
        total_points += ONBOARDING_POINTS["role"]
    if not onboarding.expertise_level:
        total_points += ONBOARDING_POINTS["expertise"]
    if not onboarding.completed:
        total_points += ONBOARDING_POINTS["completion"]
    
    # Update onboarding
    onboarding.archetype = data.archetype
    onboarding.role = data.role
    onboarding.expertise_level = data.expertise_level
    onboarding.completed = True
    onboarding.completed_at = datetime.utcnow()
    onboarding.updated_at = datetime.utcnow()
    
    session.add(onboarding)
    
    # Update user username and full_name if provided
    user_updated = False
    if data.username and data.username != current_user.username:
        # Check if username is already taken by another user
        existing_username = session.exec(
            select(User).where(
                (User.username == data.username) & (User.id != current_user.id)
            )
        ).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        # Validate username format (alphanumeric, underscore, 3-20 chars)
        import re
        if not re.match(r'^[a-zA-Z0-9_]{3,20}$', data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username must be 3-20 characters and contain only letters, numbers, and underscores"
            )
        current_user.username = data.username
        user_updated = True
    
    if data.full_name:
        current_user.full_name = data.full_name
        user_updated = True
    
    if user_updated:
        session.add(current_user)
    
    # Update profile
    profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
    if profile:
        profile.role = data.role
        profile.expertise_badge = data.expertise_level
        if data.full_name:
            profile.display_name = data.full_name
        # Save location and bio if provided
        if data.location:
            profile.location = data.location
        if data.bio:
            profile.bio = data.bio
        session.add(profile)
    
    session.commit()
    
    # Award all points
    if total_points > 0:
        await award_points(current_user.id, "onboarding_complete", total_points, session)
    
    return {
        "message": "Onboarding completed successfully",
        "points_earned": total_points,
        "onboarding": {
            "archetype": data.archetype,
            "role": data.role,
            "expertise_level": data.expertise_level
        }
    }

