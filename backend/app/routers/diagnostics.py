"""Storage diagnostic endpoint for troubleshooting."""
from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session
from app.services.s3_service import s3_service
from app.core.config import settings
from app.deps.auth import get_current_user
from app.db.models import User
from app.db.base import get_session
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def require_admin_or_dev(current_user: User = Depends(get_current_user)):
    """Require admin role or development environment."""
    if settings.ENVIRONMENT.lower() == "production":
        if current_user.role not in ["admin", "super_admin"]:
            raise HTTPException(
                status_code=403,
                detail="Admin access required for diagnostics in production"
            )
    return current_user


@router.get("/storage/status")
async def storage_status(current_user: User = Depends(require_admin_or_dev)):
    """Check Cloudflare R2 / S3 storage configuration status. Requires admin in production."""
    try:
        # Check R2 credentials (preferred)
        has_r2_account = bool(settings.R2_ACCOUNT_ID)
        has_r2_access_key = bool(settings.R2_ACCESS_KEY_ID)
        has_r2_secret_key = bool(settings.R2_SECRET_ACCESS_KEY)
        has_r2_bucket = bool(settings.R2_BUCKET_NAME)
        has_r2_public_url = bool(settings.R2_PUBLIC_URL)
        
        # Check legacy AWS credentials (fallback)
        has_aws_access_key = bool(settings.AWS_ACCESS_KEY_ID)
        has_aws_secret_key = bool(settings.AWS_SECRET_ACCESS_KEY)
        
        # Determine which provider is configured
        using_r2 = has_r2_account and has_r2_access_key and has_r2_secret_key
        using_legacy_s3 = not using_r2 and has_aws_access_key and has_aws_secret_key
        
        # Check if storage service is available
        storage_available = s3_service.is_available()
        
        # Try to test connection
        test_result = None
        test_error = None
        
        if storage_available:
            try:
                # Try to list objects (this tests the connection)
                bucket_name = settings.R2_BUCKET_NAME or settings.S3_BUCKET_NAME
                s3_service.s3_client.list_objects_v2(
                    Bucket=bucket_name,
                    MaxKeys=1
                )
                test_result = "✅ Storage connection successful"
            except Exception as e:
                test_error = str(e)
                test_result = f"❌ Storage connection failed: {test_error}"
        
        # Build configuration info
        config_info = {
            "provider": "Cloudflare R2" if using_r2 else ("AWS S3 (legacy)" if using_legacy_s3 else "Not configured"),
            "bucket_name": settings.R2_BUCKET_NAME or settings.S3_BUCKET_NAME,
        }
        
        if using_r2:
            config_info.update({
                "has_account_id": has_r2_account,
                "account_id_preview": settings.R2_ACCOUNT_ID[:10] + "..." if has_r2_account else None,
                "has_access_key_id": has_r2_access_key,
                "access_key_id_preview": settings.R2_ACCESS_KEY_ID[:10] + "..." if has_r2_access_key else None,
                "has_secret_access_key": has_r2_secret_key,
                "has_public_url": has_r2_public_url,
                "public_url": settings.R2_PUBLIC_URL if has_r2_public_url else None,
            })
        elif using_legacy_s3:
            config_info.update({
                "has_access_key_id": has_aws_access_key,
                "access_key_id_preview": settings.AWS_ACCESS_KEY_ID[:10] + "..." if has_aws_access_key else None,
                "has_secret_access_key": has_aws_secret_key,
                "region": settings.AWS_REGION,
            })
        
        # Recommendation
        if storage_available and not test_error:
            recommendation = "Storage is properly configured"
        elif using_r2 and not has_r2_public_url:
            recommendation = "R2 credentials found but R2_PUBLIC_URL is not set. Set R2_PUBLIC_URL to your public bucket URL."
        elif not using_r2 and not using_legacy_s3:
            recommendation = "No storage credentials configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_PUBLIC_URL for production."
        else:
            recommendation = "Please check storage credentials and bucket configuration"
        
        return {
            "storage_configured": storage_available,
            "configuration": config_info,
            "connection_test": test_result,
            "error_details": test_error,
            "recommendation": recommendation
        }
    except Exception as e:
        logger.error(f"Storage status check failed: {str(e)}")
        return {
            "storage_configured": False,
            "error": str(e),
            "recommendation": "Check server logs for detailed error information"
        }


# Legacy endpoint for backwards compatibility
@router.get("/s3/status")
async def s3_status(current_user: User = Depends(require_admin_or_dev)):
    """Legacy endpoint - redirects to /storage/status. Requires admin in production."""
    return await storage_status(current_user)


@router.get("/env/check")
async def env_check(current_user: User = Depends(require_admin_or_dev)):
    """Check environment variable configuration. Requires admin in production."""
    # Determine storage provider
    using_r2 = bool(settings.R2_ACCOUNT_ID and settings.R2_ACCESS_KEY_ID and settings.R2_SECRET_ACCESS_KEY)
    
    return {
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG,
        "base_url": settings.BASE_URL,
        "database_configured": bool(settings.DATABASE_URL),
        "google_oauth_configured": bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET),
        "google_redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "cors_origins": settings.cors_origins_list,
        "storage_provider": "Cloudflare R2" if using_r2 else "AWS S3 (legacy)" if settings.AWS_ACCESS_KEY_ID else "Local",
        "storage_configured": s3_service.is_available(),
        "storage_bucket": settings.R2_BUCKET_NAME or settings.S3_BUCKET_NAME,
        "storage_public_url": settings.R2_PUBLIC_URL if using_r2 else None,
    }
