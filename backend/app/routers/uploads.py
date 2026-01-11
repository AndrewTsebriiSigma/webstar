"""File upload router with FFmpeg media compression.

Supports photo, video, audio, and PDF uploads to Cloudflare R2.
Media files are automatically compressed using FFmpeg before storage
to reduce costs while maintaining display quality.
"""
import os
import uuid
import logging
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlmodel import Session, select

from app.db.base import get_session
from app.db.models import User, Profile, PointsTransaction, UserPoints
from app.deps.auth import get_current_user
from app.core.config import settings
from app.services.s3_service import s3_service
from app.services.media_compression_service import compression_service

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
    """Upload profile picture to R2 with optional compression."""
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file content
        content = await file.read()
        original_size = len(content)
        
        # Compress image if FFmpeg is available
        final_content = content
        final_filename = f"{uuid.uuid4()}{os.path.splitext(file.filename)[1] if file.filename else '.jpg'}"
        final_content_type = file.content_type or "image/jpeg"
        
        if settings.COMPRESSION_ENABLED and compression_service.is_available():
            result = compression_service.compress_image(
                content, 
                file.filename or "image.jpg",
                settings.COMPRESSION_IMAGE_PRESET,
                settings.COMPRESSION_IMAGE_FORMAT
            )
            if result.success and result.compressed_content:
                final_content = result.compressed_content
                final_filename = result.output_filename
                final_content_type = result.content_type
                logger.info(f"Profile picture compressed: {result.savings_percent} reduction")
        
        # Try R2 first (production), fallback to local (development)
        if s3_service.is_available():
            # Upload to R2
            s3_key = f"profile_pictures/{final_filename}"
            file_url = s3_service.upload_file(
                file_content=final_content,
                file_key=s3_key,
                content_type=final_content_type
            )
            
            if not file_url:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to upload to R2. Please check server logs."
                )
            
            logger.info(f"Profile picture uploaded to R2: {file_url}")
        else:
            # Fallback to local storage (development only)
            logger.warning("R2 not available, using local storage (NOT recommended for production)")
            file_path = UPLOAD_DIR / "profile_pictures" / final_filename
            file_path.parent.mkdir(exist_ok=True, parents=True)
            
            with open(file_path, "wb") as f:
                f.write(final_content)
            
            file_url = f"/uploads/profile_pictures/{final_filename}"
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
            "url": file_url,
            "original_size": original_size,
            "final_size": len(final_content),
            "compressed": len(final_content) < original_size
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
    media_type: str = Form("photo"),
    compress: bool = Form(True),
    quality: str = Form("standard"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Upload media file with automatic FFmpeg compression.
    
    Compression reduces storage costs significantly:
    - Video: 70-85% reduction (H.264/AAC in MP4)
    - Photo: 60-80% reduction (WebP or optimized JPEG)
    - Audio: 50-70% reduction (AAC in M4A)
    - PDF: No compression (kept as-is)
    
    Args:
        file: The media file to upload
        media_type: Type of media (photo, video, audio, pdf)
        compress: Whether to compress the file (default: True)
        quality: Compression quality preset (high, standard, low)
    """
    try:
        logger.info(
            f"Upload request - media_type: {media_type}, compress: {compress}, "
            f"quality: {quality}, content_type: {file.content_type}, filename: {file.filename}"
        )
        
        # Validate media type
        valid_media_types = ["photo", "video", "audio", "pdf"]
        if media_type not in valid_media_types:
            raise HTTPException(status_code=400, detail=f"Invalid media type: {media_type}")
        
        # Validate file type - permissive approach
        valid_types = {
            "photo": ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
            "video": [
                "video/mp4", 
                "video/quicktime", 
                "video/x-msvideo", 
                "video/webm", 
                "video/mpeg",
                "video/x-matroska",
                "video/ogg",
                "application/octet-stream"
            ],
            "audio": ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/mp4", "audio/x-m4a"],
            "pdf": ["application/pdf"]
        }
        
        # Check if content type is valid for the media type
        if file.content_type and file.content_type not in valid_types[media_type]:
            # If it's a video and has application/octet-stream, check file extension
            if media_type == "video" and file.content_type == "application/octet-stream":
                file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
                valid_video_exts = [".mp4", ".mov", ".avi", ".webm", ".mpeg", ".mpg", ".mkv"]
                if file_ext not in valid_video_exts:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid video file extension: {file_ext}. Expected: {', '.join(valid_video_exts)}"
                    )
            else:
                logger.warning(f"Invalid content type for {media_type}: {file.content_type}")
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type '{file.content_type}' for {media_type}. Expected: {', '.join(valid_types[media_type])}"
                )
        
        # Read file content
        content = await file.read()
        original_size = len(content)
        
        # SECURITY: Validate file size first (before validation)
        max_sizes = {
            "photo": 20 * 1024 * 1024,      # 20MB (will compress to ~2-5MB)
            "video": 1024 * 1024 * 1024,    # 1GB (will compress significantly)
            "audio": 100 * 1024 * 1024,     # 100MB (will compress to ~20-30MB)
            "pdf": 50 * 1024 * 1024         # 50MB (no compression)
        }
        
        if original_size > max_sizes[media_type]:
            max_size_mb = max_sizes[media_type] / (1024 * 1024)
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size for {media_type} is {max_size_mb:.0f}MB"
            )
        
        # === COMPRESSION LOGIC ===
        final_content = content
        file_ext = os.path.splitext(file.filename)[1] if file.filename else ""
        final_filename = f"{uuid.uuid4()}{file_ext}"
        final_content_type = file.content_type or "application/octet-stream"
        compression_applied = False
        compression_error = None
        
        # Use compression settings from config if not explicitly disabled
        should_compress = compress and settings.COMPRESSION_ENABLED and compression_service.is_available()
        
        if should_compress and media_type != "pdf":
            # Use quality from request or fall back to config
            preset = quality if quality in ["high", "standard", "low"] else settings.COMPRESSION_VIDEO_PRESET
            
            if media_type == "video":
                logger.info(f"Compressing video with preset: {preset}")
                result = compression_service.compress_video(
                    content, 
                    file.filename or "video.mp4", 
                    preset
                )
                if result.success and result.compressed_content:
                    final_content = result.compressed_content
                    final_filename = result.output_filename
                    final_content_type = result.content_type
                    compression_applied = True
                    logger.info(f"Video compressed: {result.savings_percent} reduction")
                else:
                    compression_error = result.error
                    logger.warning(f"Video compression failed, using original: {result.error}")
            
            elif media_type == "photo":
                logger.info(f"Compressing image with preset: {preset}")
                result = compression_service.compress_image(
                    content, 
                    file.filename or "image.jpg",
                    preset,
                    settings.COMPRESSION_IMAGE_FORMAT
                )
                if result.success and result.compressed_content:
                    final_content = result.compressed_content
                    final_filename = result.output_filename
                    final_content_type = result.content_type
                    compression_applied = True
                    logger.info(f"Image compressed: {result.savings_percent} reduction")
                else:
                    compression_error = result.error
                    logger.warning(f"Image compression failed, using original: {result.error}")
            
            elif media_type == "audio":
                logger.info(f"Compressing audio with preset: {preset}")
                result = compression_service.compress_audio(
                    content, 
                    file.filename or "audio.mp3",
                    preset
                )
                if result.success and result.compressed_content:
                    final_content = result.compressed_content
                    final_filename = result.output_filename
                    final_content_type = result.content_type
                    compression_applied = True
                    logger.info(f"Audio compressed: {result.savings_percent} reduction")
                else:
                    compression_error = result.error
                    logger.warning(f"Audio compression failed, using original: {result.error}")
        
        elif media_type == "pdf":
            # PDFs are not compressed, keep original
            final_filename = f"{uuid.uuid4()}.pdf"
            final_content_type = "application/pdf"
        
        # === UPLOAD TO R2 ===
        final_size = len(final_content)
        
        if s3_service.is_available():
            s3_key = f"{media_type}/{final_filename}"
            file_url = s3_service.upload_file(
                file_content=final_content,
                file_key=s3_key,
                content_type=final_content_type
            )
            
            if not file_url:
                raise HTTPException(
                    status_code=500,
                    detail="Failed to upload to R2. Please check credentials and bucket configuration."
                )
            
            logger.info(f"Media uploaded to R2: {file_url} ({final_size/1024/1024:.2f}MB)")
        else:
            # Fallback to local storage (development only)
            logger.warning("R2 not available, using local storage (NOT recommended for production)")
            
            try:
                file_path = UPLOAD_DIR / media_type / final_filename
                file_path.parent.mkdir(exist_ok=True, parents=True)
                
                with open(file_path, "wb") as f:
                    f.write(final_content)
                
                file_url = f"/uploads/{media_type}/{final_filename}"
                logger.info(f"Media uploaded locally: {file_url}")
            except Exception as e:
                logger.error(f"Failed to save file locally: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail="File upload failed. R2 is not configured and local storage is unavailable."
                )
        
        # Calculate savings
        savings_bytes = original_size - final_size
        savings_percent = (savings_bytes / original_size * 100) if original_size > 0 else 0
        
        return {
            "message": "Media uploaded successfully",
            "url": file_url,
            "media_type": media_type,
            "filename": final_filename,
            "original_size": original_size,
            "final_size": final_size,
            "compression_applied": compression_applied,
            "compression_savings": f"{savings_percent:.1f}%",
            "compression_error": compression_error
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
    """Upload project cover image to R2 with compression."""
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read file content
    content = await file.read()
    original_size = len(content)
    
    # Compress image if FFmpeg is available
    final_content = content
    final_filename = f"{uuid.uuid4()}{os.path.splitext(file.filename)[1] if file.filename else '.jpg'}"
    final_content_type = file.content_type or "image/jpeg"
    
    if settings.COMPRESSION_ENABLED and compression_service.is_available():
        result = compression_service.compress_image(
            content,
            file.filename or "cover.jpg",
            settings.COMPRESSION_IMAGE_PRESET,
            settings.COMPRESSION_IMAGE_FORMAT
        )
        if result.success and result.compressed_content:
            final_content = result.compressed_content
            final_filename = result.output_filename
            final_content_type = result.content_type
            logger.info(f"Project cover compressed: {result.savings_percent} reduction")
    
    # Try R2 first (production), fallback to local (development)
    if s3_service.is_available():
        s3_key = f"project_covers/{final_filename}"
        file_url = s3_service.upload_file(
            file_content=final_content,
            file_key=s3_key,
            content_type=final_content_type
        )
        
        if not file_url:
            raise HTTPException(
                status_code=500,
                detail="Failed to upload to R2. Please check server logs."
            )
        
        logger.info(f"Project cover uploaded to R2: {file_url}")
    else:
        # Fallback to local storage (development only)
        logger.warning("R2 not available, using local storage (NOT recommended for production)")
        file_path = UPLOAD_DIR / "project_covers" / final_filename
        file_path.parent.mkdir(exist_ok=True, parents=True)
        
        with open(file_path, "wb") as f:
            f.write(final_content)
        
        file_url = f"/uploads/project_covers/{final_filename}"
        logger.info(f"Project cover uploaded locally: {file_url}")
    
    return {
        "message": "Project cover uploaded successfully",
        "url": file_url,
        "original_size": original_size,
        "final_size": len(final_content),
        "compressed": len(final_content) < original_size
    }


@router.get("/compression-status")
async def get_compression_status():
    """Check if media compression is available and configured."""
    return {
        "compression_enabled": settings.COMPRESSION_ENABLED,
        "ffmpeg_available": compression_service.is_available(),
        "presets": {
            "video": settings.COMPRESSION_VIDEO_PRESET,
            "image": settings.COMPRESSION_IMAGE_PRESET,
            "audio": settings.COMPRESSION_AUDIO_PRESET
        },
        "image_format": settings.COMPRESSION_IMAGE_FORMAT,
        "status": "operational" if compression_service.is_available() else "ffmpeg_not_installed"
    }
