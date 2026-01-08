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
    """Get user's portfolio items (excluding drafts)."""
    items = session.exec(
        select(PortfolioItem)
        .where(PortfolioItem.user_id == current_user.id)
        .where(PortfolioItem.is_draft == False)
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
            text_content=item.text_content,
            aspect_ratio=item.aspect_ratio,
            attachment_url=item.attachment_url,
            attachment_type=item.attachment_type,
            is_draft=item.is_draft,
            views=item.views,
            clicks=item.clicks,
            order=item.order,
            created_at=item.created_at.isoformat()
        )
        for item in items
    ]


@router.get("/drafts", response_model=List[PortfolioItemResponse])
async def get_draft_items(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get user's draft portfolio items."""
    items = session.exec(
        select(PortfolioItem)
        .where(PortfolioItem.user_id == current_user.id)
        .where(PortfolioItem.is_draft == True)
        .order_by(PortfolioItem.created_at.desc())
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
            text_content=item.text_content,
            aspect_ratio=item.aspect_ratio,
            attachment_url=item.attachment_url,
            attachment_type=item.attachment_type,
            is_draft=item.is_draft,
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
    """Get another user's portfolio items (public, excluding drafts)."""
    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    items = session.exec(
        select(PortfolioItem)
        .where(PortfolioItem.user_id == user.id)
        .where(PortfolioItem.is_draft == False)
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
            text_content=item.text_content,
            aspect_ratio=item.aspect_ratio,
            attachment_url=item.attachment_url,
            attachment_type=item.attachment_type,
            is_draft=item.is_draft,
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
    valid_types = ["photo", "video", "audio", "pdf", "text", "link"]
    if item_data.content_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid content_type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Validate text posts have text_content
    if item_data.content_type == "text" and not item_data.text_content:
        raise HTTPException(
            status_code=400,
            detail="text_content is required for text posts"
        )
    
    # Validate non-text posts have content_url
    if item_data.content_type != "text" and not item_data.content_url:
        raise HTTPException(
            status_code=400,
            detail="content_url is required for non-text posts"
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
        text_content=item_data.text_content,
        aspect_ratio=item_data.aspect_ratio,
        attachment_url=item_data.attachment_url,
        attachment_type=item_data.attachment_type,
        is_draft=item_data.is_draft,
        order=order
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    
    # Only update profile count and award points if not a draft
    if not item_data.is_draft:
        # Update profile portfolio count
        profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
        if profile:
            profile.portfolio_items_count += 1
            session.add(profile)
            session.commit()
        
        # Award points for first upload
        existing_count = len([i for i in max_order if not i.is_draft])
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
        text_content=item.text_content,
        aspect_ratio=item.aspect_ratio,
        attachment_url=item.attachment_url,
        attachment_type=item.attachment_type,
        is_draft=item.is_draft,
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
    
    # Track if transitioning from draft to published
    was_draft = item.is_draft
    
    # Update all provided fields
    if updates.title is not None:
        item.title = updates.title
    if updates.description is not None:
        item.description = updates.description
    if updates.order is not None:
        item.order = updates.order
    if updates.content_type is not None:
        item.content_type = updates.content_type
    if updates.content_url is not None:
        item.content_url = updates.content_url
    if updates.thumbnail_url is not None:
        item.thumbnail_url = updates.thumbnail_url
    if updates.text_content is not None:
        item.text_content = updates.text_content
    if updates.aspect_ratio is not None:
        item.aspect_ratio = updates.aspect_ratio
    if updates.attachment_url is not None:
        item.attachment_url = updates.attachment_url
    if updates.attachment_type is not None:
        item.attachment_type = updates.attachment_type
    if updates.is_draft is not None:
        item.is_draft = updates.is_draft
        
        # If publishing a draft (transitioning from draft to published), increment profile count
        if was_draft and not updates.is_draft:
            profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
            if profile:
                profile.portfolio_items_count += 1
                session.add(profile)
    
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
        text_content=item.text_content,
        aspect_ratio=item.aspect_ratio,
        attachment_url=item.attachment_url,
        attachment_type=item.attachment_type,
        is_draft=item.is_draft,
        views=item.views,
        clicks=item.clicks,
        order=item.order,
        created_at=item.created_at.isoformat()
    )


@router.post("/{item_id}/publish", response_model=PortfolioItemResponse)
async def publish_draft(
    item_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Publish a draft portfolio item."""
    item = session.get(PortfolioItem, item_id)
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    if not item.is_draft:
        raise HTTPException(status_code=400, detail="Item is already published")
    
    # Mark as published
    item.is_draft = False
    session.add(item)
    
    # Update profile portfolio count
    profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
    if profile:
        profile.portfolio_items_count += 1
        session.add(profile)
    
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
        text_content=item.text_content,
        aspect_ratio=item.aspect_ratio,
        attachment_url=item.attachment_url,
        attachment_type=item.attachment_type,
        is_draft=item.is_draft,
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

