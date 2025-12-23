"""Analytics router."""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func

from app.db.base import get_session
from app.db.models import User, ProfileView, PortfolioItem, Project
from app.deps.auth import get_current_user
from app.schemas.profile import ProfileMetrics

router = APIRouter()


@router.get("/profile", response_model=ProfileMetrics)
async def get_profile_analytics(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get profile analytics for current user."""
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)
    
    # Profile views in last 7 days
    views_7d = session.exec(
        select(func.count(ProfileView.id))
        .where(ProfileView.profile_user_id == current_user.id)
        .where(ProfileView.created_at >= seven_days_ago)
    ).one()
    
    # Profile views in last 30 days
    views_30d = session.exec(
        select(func.count(ProfileView.id))
        .where(ProfileView.profile_user_id == current_user.id)
        .where(ProfileView.created_at >= thirty_days_ago)
    ).one()
    
    # Get profile from earlier models
    from app.db.models import Profile, ProfileLike
    profile = session.exec(
        select(Profile).where(Profile.user_id == current_user.id)
    ).first()
    
    profile_likes = session.exec(
        select(func.count(ProfileLike.id))
        .where(ProfileLike.liked_profile_user_id == current_user.id)
    ).one()
    
    # Portfolio stats
    portfolio_items = session.exec(
        select(PortfolioItem).where(PortfolioItem.user_id == current_user.id)
    ).all()
    
    portfolio_views = sum(item.views for item in portfolio_items)
    portfolio_clicks = sum(item.clicks for item in portfolio_items)
    
    # Project stats
    projects = session.exec(
        select(Project).where(Project.user_id == current_user.id)
    ).all()
    
    project_views = sum(proj.views for proj in projects)
    project_clicks = sum(proj.clicks for proj in projects)
    
    return ProfileMetrics(
        profile_views_7d=views_7d or 0,
        profile_views_30d=views_30d or 0,
        profile_likes=profile_likes or 0,
        portfolio_views=portfolio_views,
        portfolio_clicks=portfolio_clicks,
        project_views=project_views,
        project_clicks=project_clicks
    )

