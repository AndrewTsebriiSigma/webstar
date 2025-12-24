"""File upload router."""
import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlmodel import Session

from app.db.base import get_session
from app.db.models import User, Profile, PointsTransaction, UserPoints
from app.deps.auth import get_current_user
from app.core.config import settings

router = APIRouter()

# Local uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


async def award_points_upload(user_id: int, action: str, points: int, session: Session):
    """Award points for upload actions."""
    transaction = PointsTransaction(
        user_id=user_id,
        points=points,
        action=action,
        description=f"Upload: {action}"
    )
    session.add(transaction)
    
    user_points = session.exec(select(UserPoints).where(UserPoints.user_id == user_id)).first()
    if user_points:
        user_points.total_points += points
        user_points.available_points += points
        session.add(user_points)
    
    session.commit()


@router.post("/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Upload profile picture."""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        filename = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / "profile_pictures" / filename
        file_path.parent.mkdir(exist_ok=True, parents=True)
        
        # Save file
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Generate URL (relative to uploads directory)
        file_url = f"/uploads/profile_pictures/{filename}"
        
        # Update profile
        profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
        if profile:
            # Award points if first profile picture
            if not profile.profile_picture:
                await award_points_upload(current_user.id, "profile_picture", 10, session)
            
            profile.profile_picture = file_url
            session.add(profile)
            session.commit()
        
        return {
            "message": "Profile picture uploaded successfully",
            "url": file_url
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading profile picture for user {current_user.id}: {str(e)}")
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload profile picture: {str(e)}"
        )


@router.post("/media")
async def upload_media(
    file: UploadFile = File(...),
    media_type: Optional[str] = "photo",
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Upload media file (photo, video, audio)."""
    # Validate file type
    valid_types = {
        "photo": ["image/jpeg", "image/png", "image/gif", "image/webp"],
        "video": ["video/mp4", "video/quicktime", "video/x-msvideo"],
        "audio": ["audio/mpeg", "audio/wav", "audio/ogg"]
    }
    
    if media_type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid media type")
    
    if file.content_type not in valid_types[media_type]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type for {media_type}. Expected: {', '.join(valid_types[media_type])}"
        )
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / media_type / filename
    file_path.parent.mkdir(exist_ok=True)
    
    # Save file
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Generate URL
    file_url = f"/uploads/{media_type}/{filename}"
    
    return {
        "message": "Media uploaded successfully",
        "url": file_url,
        "media_type": media_type,
        "filename": filename
    }


@router.post("/project-cover")
async def upload_project_cover(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Upload project cover image."""
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / "project_covers" / filename
    file_path.parent.mkdir(exist_ok=True)
    
    # Save file
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Generate URL
    file_url = f"/uploads/project_covers/{filename}"
    
    return {
        "message": "Project cover uploaded successfully",
        "url": file_url
    }

