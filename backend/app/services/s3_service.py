"""S3 service for persistent file storage."""
import boto3
from botocore.exceptions import ClientError
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class S3Service:
    """Service for uploading files to AWS S3."""
    
    def __init__(self):
        """Initialize S3 client."""
        self.s3_client = None
        self.bucket_name = settings.S3_BUCKET_NAME
        
        # Only initialize if credentials are provided
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            try:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION
                )
                logger.info(f"S3 client initialized for bucket: {self.bucket_name}")
            except Exception as e:
                logger.error(f"Failed to initialize S3 client: {str(e)}")
                self.s3_client = None
        else:
            logger.warning("S3 credentials not provided. File uploads will use local storage (NOT recommended for production).")
    
    def is_available(self) -> bool:
        """Check if S3 service is available."""
        return self.s3_client is not None and self.bucket_name
    
    def upload_file(
        self, 
        file_content: bytes, 
        file_key: str, 
        content_type: str = 'application/octet-stream'
    ) -> Optional[str]:
        """
        Upload file to S3.
        
        Args:
            file_content: File content as bytes
            file_key: S3 key (path) for the file
            content_type: MIME type of the file
            
        Returns:
            Public URL of uploaded file, or None if upload failed
        """
        if not self.is_available():
            logger.error("S3 service not available")
            return None
        
        try:
            # Upload to S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=file_key,
                Body=file_content,
                ContentType=content_type,
                ACL='public-read'  # Make file publicly accessible
            )
            
            # Generate public URL
            url = f"https://{self.bucket_name}.s3.{settings.AWS_REGION}.amazonaws.com/{file_key}"
            logger.info(f"File uploaded successfully: {url}")
            return url
            
        except ClientError as e:
            logger.error(f"S3 upload failed: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during S3 upload: {str(e)}")
            return None
    
    def delete_file(self, file_key: str) -> bool:
        """
        Delete file from S3.
        
        Args:
            file_key: S3 key (path) of the file
            
        Returns:
            True if deleted successfully, False otherwise
        """
        if not self.is_available():
            logger.error("S3 service not available")
            return False
        
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            logger.info(f"File deleted successfully: {file_key}")
            return True
            
        except ClientError as e:
            logger.error(f"S3 delete failed: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during S3 delete: {str(e)}")
            return False
    
    def get_presigned_url(self, file_key: str, expiration: int = 3600) -> Optional[str]:
        """
        Generate a presigned URL for temporary access to a private file.
        
        Args:
            file_key: S3 key (path) of the file
            expiration: URL expiration time in seconds
            
        Returns:
            Presigned URL or None if generation failed
        """
        if not self.is_available():
            logger.error("S3 service not available")
            return None
        
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_key},
                ExpiresIn=expiration
            )
            return url
            
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {str(e)}")
            return None


# Singleton instance
s3_service = S3Service()

