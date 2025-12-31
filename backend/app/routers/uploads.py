"""File upload router."""
import os
import uuid
import logging
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlmodel import Session, select

from app.db.base import get_session
from app.db.models import User, Profile, PointsTransaction, UserPoints
from app.deps.auth import get_current_user
from app.core.config import settings
from app.services.s3_service import s3_service

logger = logging.getLogger(__name__)
router = APIRouter()

# Local uploads directory (fallback for development)
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
    """Upload profile picture to S3 or local storage."""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Generate unique filename
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        filename = f"{uuid.uuid4()}{file_ext}"
        
        # Read file content
        content = await file.read()
        
        # Try S3 first (production), fallback to local (development)
        if s3_service.is_available():
            # Upload to S3
            s3_key = f"profile_pictures/{filename}"
            file_url = s3_service.upload_file(
                file_content=content,
                file_key=s3_key,
                content_type=file.content_type or "image/jpeg"
            )
            
            if not file_url:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to upload to S3. Please check server logs."
                )
            
            logger.info(f"Profile picture uploaded to S3: {file_url}")
        else:
            # Fallback to local storage (development only)
            logger.warning("S3 not available, using local storage (NOT recommended for production)")
            file_path = UPLOAD_DIR / "profile_pictures" / filename
            file_path.parent.mkdir(exist_ok=True, parents=True)
            
            with open(file_path, "wb") as f:
                f.write(content)
            
            file_url = f"/uploads/profile_pictures/{filename}"
            logger.info(f"Profile picture uploaded locally: {file_url}")
        
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
    """Upload media file (photo, video, audio) to S3 or local storage."""
    try:
        # Validate file type
        valid_types = {
            "photo": ["image/jpeg", "image/png", "image/gif", "image/webp"],
            "video": ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/mpeg"],
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
        
        # Read file content
        content = await file.read()
        
        # Validate file size (200MB max for videos, 5MB for photos, 10MB for audio)
        max_sizes = {
            "photo": 5 * 1024 * 1024,      # 5MB
            "video": 200 * 1024 * 1024,    # 200MB
            "audio": 10 * 1024 * 1024      # 10MB
        }
        
        if len(content) > max_sizes[media_type]:
            max_size_mb = max_sizes[media_type] / (1024 * 1024)
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size for {media_type} is {max_size_mb}MB"
            )
        
        # Try S3 first (production), fallback to local (development)
        if s3_service.is_available():
            # Upload to S3
            s3_key = f"{media_type}/{filename}"
            file_url = s3_service.upload_file(
                file_content=content,
                file_key=s3_key,
                content_type=file.content_type or "application/octet-stream"
            )
            
            if not file_url:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to upload to S3. Please check AWS credentials and bucket configuration."
                )
            
            logger.info(f"Media uploaded to S3: {file_url}")
        else:
            # Fallback to local storage (development only)
            logger.warning("S3 not available, using local storage (NOT recommended for production)")
            
            try:
                file_path = UPLOAD_DIR / media_type / filename
                file_path.parent.mkdir(exist_ok=True, parents=True)
                
                with open(file_path, "wb") as f:
                    f.write(content)
                
                # Return a placeholder URL that indicates local storage
                # In production, you MUST configure S3
                file_url = f"/uploads/{media_type}/{filename}"
                logger.info(f"Media uploaded locally: {file_url}")
            except Exception as e:
                logger.error(f"Failed to save file locally: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail="File upload failed. S3 is not configured and local storage is unavailable. Please configure AWS S3 credentials."
                )
        
        return {
            "message": "Media uploaded successfully",
            "url": file_url,
            "media_type": media_type,
            "filename": filename
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading media: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload media: {str(e)}"
        )


@router.post("/project-cover")
async def upload_project_cover(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Upload project cover image to S3 or local storage."""
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4()}{file_ext}"
    
    # Read file content
    content = await file.read()
    
    # Try S3 first (production), fallback to local (development)
    if s3_service.is_available():
        # Upload to S3
        s3_key = f"project_covers/{filename}"
        file_url = s3_service.upload_file(
            file_content=content,
            file_key=s3_key,
            content_type=file.content_type or "image/jpeg"
        )
        
        if not file_url:
            raise HTTPException(
                status_code=500,
                detail="Failed to upload to S3. Please check server logs."
            )
        
        logger.info(f"Project cover uploaded to S3: {file_url}")
    else:
        # Fallback to local storage (development only)
        logger.warning("S3 not available, using local storage (NOT recommended for production)")
        file_path = UPLOAD_DIR / "project_covers" / filename
        file_path.parent.mkdir(exist_ok=True, parents=True)
        
        with open(file_path, "wb") as f:
            f.write(content)
        
        file_url = f"/uploads/project_covers/{filename}"
        logger.info(f"Project cover uploaded locally: {file_url}")
    
    return {
        "message": "Project cover uploaded successfully",
        "url": file_url
    }

