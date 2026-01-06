"""Analytics router."""
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from pydantic import BaseModel

from app.db.base import get_session
from app.db.models import User, ProfileView, PortfolioItem, Project
from app.deps.auth import get_current_user
from app.schemas.profile import ProfileMetrics

router = APIRouter()


class DailyAnalytics(BaseModel):
    """Daily analytics data point."""
    date: str
    profile_views: int
    link_clicks: int


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


@router.get("/daily", response_model=List[DailyAnalytics])
async def get_daily_analytics(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get daily analytics for last 30 days."""
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    
    # Get all profile views for last 30 days
    profile_views = session.exec(
        select(ProfileView)
        .where(ProfileView.profile_user_id == current_user.id)
        .where(ProfileView.created_at >= thirty_days_ago)
        .order_by(ProfileView.created_at)
    ).all()
    
    # Get portfolio and project items for link clicks calculation
    portfolio_items = session.exec(
        select(PortfolioItem).where(PortfolioItem.user_id == current_user.id)
    ).all()
    
    projects = session.exec(
        select(Project).where(Project.user_id == current_user.id)
    ).all()
    
    # Initialize daily data for last 30 days
    daily_data = {}
    for i in range(30):
        day = thirty_days_ago + timedelta(days=i)
        day_str = day.strftime('%Y-%m-%d')
        daily_data[day_str] = {
            'date': day.strftime('%b %d'),
            'profile_views': 0,
            'link_clicks': 0
        }
    
    # Count profile views per day
    for view in profile_views:
        day_str = view.created_at.strftime('%Y-%m-%d')
        if day_str in daily_data:
            daily_data[day_str]['profile_views'] += 1
    
    # Calculate total clicks and distribute across days (simplified)
    total_clicks = sum(item.clicks for item in portfolio_items) + sum(proj.clicks for proj in projects)
    if total_clicks > 0:
        clicks_per_day = total_clicks // 30
        remainder = total_clicks % 30
        for i, day_str in enumerate(daily_data):
            daily_data[day_str]['link_clicks'] = clicks_per_day + (1 if i < remainder else 0)
    
    # Convert to list sorted by date
    result = [
        DailyAnalytics(
            date=data['date'],
            profile_views=data['profile_views'],
            link_clicks=data['link_clicks']
        )
        for data in daily_data.values()
    ]
    
    return result

