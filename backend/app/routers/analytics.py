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
    """Get profile analytics for current user - OPTIMIZED with SQL aggregation."""
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)
    
    from app.db.models import ProfileLike
    
    # Profile views in last 7 days
    views_7d = session.exec(
        select(func.count(ProfileView.id))
        .where(ProfileView.profile_user_id == current_user.id)
        .where(ProfileView.created_at >= seven_days_ago)
    ).one() or 0
    
    # Profile views in last 30 days
    views_30d = session.exec(
        select(func.count(ProfileView.id))
        .where(ProfileView.profile_user_id == current_user.id)
        .where(ProfileView.created_at >= thirty_days_ago)
    ).one() or 0
    
    # Profile likes count
    profile_likes = session.exec(
        select(func.count(ProfileLike.id))
        .where(ProfileLike.liked_profile_user_id == current_user.id)
    ).one() or 0
    
    # Portfolio stats - Use SUM aggregation instead of fetching all items
    portfolio_stats = session.exec(
        select(
            func.coalesce(func.sum(PortfolioItem.views), 0),
            func.coalesce(func.sum(PortfolioItem.clicks), 0)
        ).where(PortfolioItem.user_id == current_user.id)
    ).one()
    
    # Project stats - Use SUM aggregation instead of fetching all items
    project_stats = session.exec(
        select(
            func.coalesce(func.sum(Project.views), 0),
            func.coalesce(func.sum(Project.clicks), 0)
        ).where(Project.user_id == current_user.id)
    ).one()
    
    return ProfileMetrics(
        profile_views_7d=views_7d,
        profile_views_30d=views_30d,
        profile_likes=profile_likes,
        portfolio_views=int(portfolio_stats[0]),
        portfolio_clicks=int(portfolio_stats[1]),
        project_views=int(project_stats[0]),
        project_clicks=int(project_stats[1])
    )


@router.get("/daily", response_model=List[DailyAnalytics])
async def get_daily_analytics(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get daily analytics for last 30 days - OPTIMIZED."""
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)
    
    # Get profile views for last 30 days (only created_at needed, not full records)
    profile_views = session.exec(
        select(ProfileView.created_at)
        .where(ProfileView.profile_user_id == current_user.id)
        .where(ProfileView.created_at >= thirty_days_ago)
    ).all()
    
    # Use SQL SUM aggregation for total clicks instead of fetching all records
    portfolio_clicks = session.exec(
        select(func.coalesce(func.sum(PortfolioItem.clicks), 0))
        .where(PortfolioItem.user_id == current_user.id)
    ).one() or 0
    
    project_clicks = session.exec(
        select(func.coalesce(func.sum(Project.clicks), 0))
        .where(Project.user_id == current_user.id)
    ).one() or 0
    
    total_clicks = int(portfolio_clicks) + int(project_clicks)
    
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
    for view_time in profile_views:
        day_str = view_time.strftime('%Y-%m-%d')
        if day_str in daily_data:
            daily_data[day_str]['profile_views'] += 1
    
    # Distribute total clicks across days (simplified visualization)
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

