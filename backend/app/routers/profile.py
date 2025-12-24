"""Profile router."""
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy.exc import OperationalError, IntegrityError

from app.db.base import get_session
from app.db.models import User, Profile, ProfileLike, UserPoints, PortfolioItem, Project
from app.deps.auth import get_current_user, get_current_user_optional
from app.schemas.profile import ProfileUpdate, ProfileResponse

logger = logging.getLogger(__name__)

router = APIRouter()


def calculate_profile_completeness(profile: Profile) -> int:
    """Calculate profile completeness percentage."""
    total_fields = 6
    completed = 0
    
    if profile.profile_picture:
        completed += 1
    if profile.about:
        completed += 1
    if profile.skills:
        completed += 1
    if profile.role:
        completed += 1
    if profile.website or profile.linkedin_url or profile.github_url:
        completed += 1
    # Check if has portfolio or projects
    if profile.portfolio_items_count > 0 or profile.projects_count > 0:
        completed += 1
    
    return int((completed / total_fields) * 100)


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get current user's profile."""
    profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get points
    user_points = session.exec(select(UserPoints).where(UserPoints.user_id == current_user.id)).first()
    total_points = user_points.total_points if user_points else 0
    
    return ProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        username=current_user.username,
        display_name=profile.display_name,
        role=profile.role,
        expertise_badge=profile.expertise_badge,
        about=profile.about,
        profile_picture=profile.profile_picture,
        skills=profile.skills,
        experience=profile.experience,
        social_links=profile.social_links,
        website=profile.website,
        linkedin_url=profile.linkedin_url,
        github_url=profile.github_url,
        instagram_url=profile.instagram_url,
        behance_url=profile.behance_url,
        soundcloud_url=profile.soundcloud_url,
        profile_likes_count=profile.profile_likes_count,
        profile_views_count=profile.profile_views_count,
        portfolio_items_count=profile.portfolio_items_count,
        projects_count=profile.projects_count,
        total_points=total_points,
        has_profile_picture=bool(profile.profile_picture),
        has_about=bool(profile.about),
        has_skills=bool(profile.skills),
        profile_completeness=calculate_profile_completeness(profile)
    )


@router.put("/me", response_model=ProfileResponse)
async def update_my_profile(
    updates: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update current user's profile."""
    try:
        profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Update fields
        if updates.display_name is not None:
            profile.display_name = updates.display_name
        if updates.about is not None:
            profile.about = updates.about
        if updates.skills is not None:
            profile.skills = updates.skills
        if updates.experience is not None:
            profile.experience = updates.experience
        if updates.social_links is not None:
            profile.social_links = updates.social_links
        if updates.website is not None:
            profile.website = updates.website
        if updates.linkedin_url is not None:
            profile.linkedin_url = updates.linkedin_url
        if updates.github_url is not None:
            profile.github_url = updates.github_url
        if updates.instagram_url is not None:
            profile.instagram_url = updates.instagram_url
        if updates.behance_url is not None:
            profile.behance_url = updates.behance_url
        if updates.soundcloud_url is not None:
            profile.soundcloud_url = updates.soundcloud_url
        
        session.add(profile)
        session.commit()
        session.refresh(profile)
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log and handle any other exceptions
        logger.error(f"Error updating profile for user {current_user.id}: {str(e)}")
        session.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to update profile: {str(e)}"
        )
    
    # Get points
    user_points = session.exec(select(UserPoints).where(UserPoints.user_id == current_user.id)).first()
    total_points = user_points.total_points if user_points else 0
    
    return ProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        username=current_user.username,
        display_name=profile.display_name,
        role=profile.role,
        expertise_badge=profile.expertise_badge,
        about=profile.about,
        profile_picture=profile.profile_picture,
        skills=profile.skills,
        website=profile.website,
        linkedin_url=profile.linkedin_url,
        github_url=profile.github_url,
        instagram_url=profile.instagram_url,
        behance_url=profile.behance_url,
        soundcloud_url=profile.soundcloud_url,
        profile_likes_count=profile.profile_likes_count,
        profile_views_count=profile.profile_views_count,
        portfolio_items_count=profile.portfolio_items_count,
        projects_count=profile.projects_count,
        total_points=total_points,
        has_profile_picture=bool(profile.profile_picture),
        has_about=bool(profile.about),
        has_skills=bool(profile.skills),
        profile_completeness=calculate_profile_completeness(profile)
    )


@router.get("/{username}", response_model=ProfileResponse)
async def get_profile_by_username(
    username: str,
    session: Session = Depends(get_session),
    current_user: User | None = Depends(get_current_user_optional)
):
    """Get public profile by username."""
    # Find user
    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get profile
    profile = session.exec(select(Profile).where(Profile.user_id == user.id)).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    # Get points (before any potential view tracking that might modify session)
    user_points = session.exec(select(UserPoints).where(UserPoints.user_id == user.id)).first()
    total_points = user_points.total_points if user_points else 0
    
    # Track view (if not own profile) - use separate session to avoid deadlocks
    # This is done asynchronously and won't block the response
    if current_user and current_user.id != user.id:
        try:
            from app.db.models import ProfileView
            from app.db.base import engine
            # Use a separate session for view tracking to avoid blocking the main response
            with Session(engine) as view_session:
                # Check if view already exists today (prevent duplicates per day)
                today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
                existing_view = view_session.exec(
                    select(ProfileView).where(
                        ProfileView.profile_user_id == user.id,
                        ProfileView.viewer_id == current_user.id,
                        ProfileView.created_at >= today_start
                    )
                ).first()
                
                if not existing_view:
                    view = ProfileView(profile_user_id=user.id, viewer_id=current_user.id)
                    view_session.add(view)
                    # Update profile views count in separate session
                    profile_for_update = view_session.get(Profile, profile.id)
                    if profile_for_update:
                        profile_for_update.profile_views_count += 1
                        view_session.add(profile_for_update)
                    view_session.commit()
                    # Refresh main session's profile to get updated count
                    session.refresh(profile)
        except (OperationalError, IntegrityError) as e:
            # Database lock or constraint error - log but don't fail the request
            logger.warning(f"Failed to track profile view for user {user.id}: {str(e)}")
        except Exception as e:
            # Any other error - log but don't fail the request
            logger.error(f"Unexpected error tracking profile view: {str(e)}")
    
    return ProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        username=user.username,  # FIX: Use profile owner's username, not current_user (which can be None)
        display_name=profile.display_name,
        role=profile.role,
        expertise_badge=profile.expertise_badge,
        about=profile.about,
        profile_picture=profile.profile_picture,
        skills=profile.skills,
        experience=profile.experience,
        social_links=profile.social_links,
        website=profile.website,
        linkedin_url=profile.linkedin_url,
        github_url=profile.github_url,
        instagram_url=profile.instagram_url,
        behance_url=profile.behance_url,
        soundcloud_url=profile.soundcloud_url,
        profile_likes_count=profile.profile_likes_count,
        profile_views_count=profile.profile_views_count,
        portfolio_items_count=profile.portfolio_items_count,
        projects_count=profile.projects_count,
        total_points=total_points,
        has_profile_picture=bool(profile.profile_picture),
        has_about=bool(profile.about),
        has_skills=bool(profile.skills),
        profile_completeness=calculate_profile_completeness(profile)
    )


@router.post("/{username}/like")
async def like_profile(
    username: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Like a profile."""
    # Find user
    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot like own profile")
    
    # Check if already liked
    existing = session.exec(
        select(ProfileLike).where(
            ProfileLike.liker_id == current_user.id,
            ProfileLike.liked_profile_user_id == user.id
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already liked this profile")
    
    # Create like
    like = ProfileLike(liker_id=current_user.id, liked_profile_user_id=user.id)
    session.add(like)
    
    # Update profile likes count
    profile = session.exec(select(Profile).where(Profile.user_id == user.id)).first()
    if profile:
        profile.profile_likes_count += 1
        session.add(profile)
    
    session.commit()
    
    return {"message": "Profile liked successfully"}


@router.delete("/{username}/like")
async def unlike_profile(
    username: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Unlike a profile."""
    # Find user
    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find like
    like = session.exec(
        select(ProfileLike).where(
            ProfileLike.liker_id == current_user.id,
            ProfileLike.liked_profile_user_id == user.id
        )
    ).first()
    
    if not like:
        raise HTTPException(status_code=404, detail="Like not found")
    
    # Delete like
    session.delete(like)
    
    # Update profile likes count
    profile = session.exec(select(Profile).where(Profile.user_id == user.id)).first()
    if profile:
        profile.profile_likes_count = max(0, profile.profile_likes_count - 1)
        session.add(profile)
    
    session.commit()
    
    return {"message": "Profile unliked successfully"}

