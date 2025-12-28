"""S3 diagnostic endpoint for troubleshooting."""
from fastapi import APIRouter, HTTPException
from app.services.s3_service import s3_service
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/s3/status")
async def s3_status():
    """Check S3 configuration status."""
    try:
        # Check if credentials are set
        has_access_key = bool(settings.AWS_ACCESS_KEY_ID)
        has_secret_key = bool(settings.AWS_SECRET_ACCESS_KEY)
        has_bucket = bool(settings.S3_BUCKET_NAME)
        has_region = bool(settings.AWS_REGION)
        
        # Check if S3 service is available
        s3_available = s3_service.is_available()
        
        # Try to test S3 connection
        test_result = None
        test_error = None
        
        if s3_available:
            try:
                # Try to list objects (this tests the connection)
                s3_service.s3_client.list_objects_v2(
                    Bucket=settings.S3_BUCKET_NAME,
                    MaxKeys=1
                )
                test_result = "✅ S3 connection successful"
            except Exception as e:
                test_error = str(e)
                test_result = f"❌ S3 connection failed: {test_error}"
        
        return {
            "s3_configured": s3_available,
            "configuration": {
                "has_access_key_id": has_access_key,
                "access_key_id_preview": settings.AWS_ACCESS_KEY_ID[:10] + "..." if has_access_key else None,
                "has_secret_access_key": has_secret_key,
                "secret_key_preview": settings.AWS_SECRET_ACCESS_KEY[:10] + "..." if has_secret_key else None,
                "bucket_name": settings.S3_BUCKET_NAME if has_bucket else None,
                "region": settings.AWS_REGION if has_region else None,
            },
            "connection_test": test_result,
            "error_details": test_error,
            "recommendation": "S3 is properly configured" if s3_available and not test_error else "Please check AWS credentials and bucket configuration"
        }
    except Exception as e:
        logger.error(f"S3 status check failed: {str(e)}")
        return {
            "s3_configured": False,
            "error": str(e),
            "recommendation": "Check server logs for detailed error information"
        }


@router.get("/env/check")
async def env_check():
    """Check environment variable configuration."""
    return {
        "environment": settings.ENVIRONMENT,
        "debug": settings.DEBUG,
        "base_url": settings.BASE_URL,
        "database_configured": bool(settings.DATABASE_URL),
        "google_oauth_configured": bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET),
        "google_redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "cors_origins": settings.cors_origins_list,
        "s3_configured": bool(settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY and settings.S3_BUCKET_NAME),
        "s3_bucket": settings.S3_BUCKET_NAME,
        "s3_region": settings.AWS_REGION,
    }

