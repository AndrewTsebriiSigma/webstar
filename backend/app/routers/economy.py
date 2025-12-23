"""Economy/Gamification router."""
from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.db.base import get_session
from app.db.models import User, UserPoints, PointsTransaction
from app.deps.auth import get_current_user
from app.schemas.economy import PointsBalance, PointsHistory, PointsTransaction as PointsTransactionSchema, RewardItem

router = APIRouter()


@router.get("/points", response_model=PointsBalance)
async def get_points_balance(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get user's points balance."""
    user_points = session.exec(
        select(UserPoints).where(UserPoints.user_id == current_user.id)
    ).first()
    
    if not user_points:
        # Create if doesn't exist
        user_points = UserPoints(user_id=current_user.id)
        session.add(user_points)
        session.commit()
        session.refresh(user_points)
    
    return PointsBalance(
        total_points=user_points.total_points,
        available_points=user_points.available_points
    )


@router.get("/history", response_model=PointsHistory)
async def get_points_history(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
    limit: int = 50
):
    """Get user's points transaction history."""
    # Get balance
    user_points = session.exec(
        select(UserPoints).where(UserPoints.user_id == current_user.id)
    ).first()
    
    if not user_points:
        user_points = UserPoints(user_id=current_user.id)
        session.add(user_points)
        session.commit()
        session.refresh(user_points)
    
    # Get transactions
    transactions = session.exec(
        select(PointsTransaction)
        .where(PointsTransaction.user_id == current_user.id)
        .order_by(PointsTransaction.created_at.desc())
        .limit(limit)
    ).all()
    
    return PointsHistory(
        balance=PointsBalance(
            total_points=user_points.total_points,
            available_points=user_points.available_points
        ),
        transactions=[
            PointsTransactionSchema(
                id=t.id,
                points=t.points,
                action=t.action,
                description=t.description,
                created_at=t.created_at.isoformat()
            )
            for t in transactions
        ]
    )


@router.get("/rewards", response_model=List[RewardItem])
async def get_available_rewards(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get available rewards that can be purchased with points."""
    # Get user's points
    user_points = session.exec(
        select(UserPoints).where(UserPoints.user_id == current_user.id)
    ).first()
    
    available_points = user_points.available_points if user_points else 0
    
    # Define rewards (V1 static list, V2 can be dynamic)
    rewards = [
        RewardItem(
            id="profile_boost_3d",
            name="Profile Boost - 3 Days",
            description="Boost your profile visibility for 3 days",
            cost=100,
            category="boost",
            available=available_points >= 100
        ),
        RewardItem(
            id="profile_boost_7d",
            name="Profile Boost - 7 Days",
            description="Boost your profile visibility for 7 days",
            cost=200,
            category="boost",
            available=available_points >= 200
        ),
        RewardItem(
            id="theme_dark",
            name="Dark Theme",
            description="Unlock dark theme for your profile",
            cost=50,
            category="theme",
            available=available_points >= 50
        ),
        RewardItem(
            id="theme_gradient",
            name="Gradient Theme",
            description="Unlock gradient theme for your profile",
            cost=75,
            category="theme",
            available=available_points >= 75
        ),
        RewardItem(
            id="analytics_advanced",
            name="Advanced Analytics",
            description="Unlock advanced analytics for 30 days",
            cost=150,
            category="feature",
            available=available_points >= 150
        ),
        RewardItem(
            id="custom_url",
            name="Custom URL",
            description="Set a custom URL for your profile",
            cost=300,
            category="feature",
            available=available_points >= 300
        ),
    ]
    
    return rewards

