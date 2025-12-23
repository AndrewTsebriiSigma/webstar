"""Portfolio router."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db.base import get_session
from app.db.models import User, PortfolioItem, Profile, PointsTransaction, UserPoints
from app.deps.auth import get_current_user
from app.schemas.portfolio import (
    PortfolioItemCreate, PortfolioItemUpdate, PortfolioItemResponse
)

router = APIRouter()


async def award_points_portfolio(user_id: int, action: str, points: int, session: Session):
    """Award points for portfolio actions."""
    transaction = PointsTransaction(
        user_id=user_id,
        points=points,
        action=action,
        description=f"Portfolio: {action}"
    )
    session.add(transaction)
    
    user_points = session.exec(select(UserPoints).where(UserPoints.user_id == user_id)).first()
    if user_points:
        user_points.total_points += points
        user_points.available_points += points
        session.add(user_points)
    
    session.commit()


@router.get("/", response_model=List[PortfolioItemResponse])
async def get_portfolio_items(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get user's portfolio items."""
    items = session.exec(
        select(PortfolioItem)
        .where(PortfolioItem.user_id == current_user.id)
        .order_by(PortfolioItem.order)
    ).all()
    
    return [
        PortfolioItemResponse(
            id=item.id,
            user_id=item.user_id,
            content_type=item.content_type,
            content_url=item.content_url,
            thumbnail_url=item.thumbnail_url,
            title=item.title,
            description=item.description,
            aspect_ratio=item.aspect_ratio,
            views=item.views,
            clicks=item.clicks,
            order=item.order,
            created_at=item.created_at.isoformat()
        )
        for item in items
    ]


@router.get("/user/{username}", response_model=List[PortfolioItemResponse])
async def get_user_portfolio_items(
    username: str,
    session: Session = Depends(get_session)
):
    """Get another user's portfolio items (public)."""
    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    items = session.exec(
        select(PortfolioItem)
        .where(PortfolioItem.user_id == user.id)
        .order_by(PortfolioItem.order)
    ).all()
    
    return [
        PortfolioItemResponse(
            id=item.id,
            user_id=item.user_id,
            content_type=item.content_type,
            content_url=item.content_url,
            thumbnail_url=item.thumbnail_url,
            title=item.title,
            description=item.description,
            aspect_ratio=item.aspect_ratio,
            views=item.views,
            clicks=item.clicks,
            order=item.order,
            created_at=item.created_at.isoformat()
        )
        for item in items
    ]


@router.post("/", response_model=PortfolioItemResponse, status_code=status.HTTP_201_CREATED)
async def create_portfolio_item(
    item_data: PortfolioItemCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a new portfolio item."""
    # Validate content type
    valid_types = ["photo", "video", "audio", "link"]
    if item_data.content_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid content_type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Get current max order
    max_order = session.exec(
        select(PortfolioItem).where(PortfolioItem.user_id == current_user.id)
    ).all()
    order = len(max_order)
    
    # Create item
    item = PortfolioItem(
        user_id=current_user.id,
        content_type=item_data.content_type,
        content_url=item_data.content_url,
        thumbnail_url=item_data.thumbnail_url,
        title=item_data.title,
        description=item_data.description,
        aspect_ratio=item_data.aspect_ratio,
        order=order
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    
    # Update profile portfolio count
    profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
    if profile:
        profile.portfolio_items_count += 1
        session.add(profile)
        session.commit()
    
    # Award points for first upload
    existing_count = len(max_order)
    if existing_count == 0:
        await award_points_portfolio(current_user.id, "first_media_upload", 30, session)
    
    return PortfolioItemResponse(
        id=item.id,
        user_id=item.user_id,
        content_type=item.content_type,
        content_url=item.content_url,
        thumbnail_url=item.thumbnail_url,
        title=item.title,
        description=item.description,
        aspect_ratio=item.aspect_ratio,
        views=item.views,
        clicks=item.clicks,
        order=item.order,
        created_at=item.created_at.isoformat()
    )


@router.put("/{item_id}", response_model=PortfolioItemResponse)
async def update_portfolio_item(
    item_id: int,
    updates: PortfolioItemUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update a portfolio item."""
    item = session.get(PortfolioItem, item_id)
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    if updates.title is not None:
        item.title = updates.title
    if updates.description is not None:
        item.description = updates.description
    if updates.order is not None:
        item.order = updates.order
    
    session.add(item)
    session.commit()
    session.refresh(item)
    
    return PortfolioItemResponse(
        id=item.id,
        user_id=item.user_id,
        content_type=item.content_type,
        content_url=item.content_url,
        thumbnail_url=item.thumbnail_url,
        title=item.title,
        description=item.description,
        aspect_ratio=item.aspect_ratio,
        views=item.views,
        clicks=item.clicks,
        order=item.order,
        created_at=item.created_at.isoformat()
    )


@router.delete("/{item_id}")
async def delete_portfolio_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a portfolio item."""
    item = session.get(PortfolioItem, item_id)
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    session.delete(item)
    
    # Update profile portfolio count
    profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
    if profile:
        profile.portfolio_items_count = max(0, profile.portfolio_items_count - 1)
        session.add(profile)
    
    session.commit()
    
    return {"message": "Portfolio item deleted successfully"}


@router.post("/{item_id}/view")
async def track_portfolio_view(
    item_id: int,
    session: Session = Depends(get_session)
):
    """Track a view on a portfolio item."""
    item = session.get(PortfolioItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    item.views += 1
    session.add(item)
    session.commit()
    
    return {"message": "View tracked"}


@router.post("/{item_id}/click")
async def track_portfolio_click(
    item_id: int,
    session: Session = Depends(get_session)
):
    """Track a click on a portfolio item."""
    item = session.get(PortfolioItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    item.clicks += 1
    session.add(item)
    session.commit()
    
    return {"message": "Click tracked"}

