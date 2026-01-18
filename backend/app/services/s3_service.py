"""Cloudflare R2 / S3-compatible service for persistent file storage."""
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)


class R2Service:
    """Service for uploading files to Cloudflare R2 (S3-compatible).
    
    Cloudflare R2 is fully S3-compatible, so we use boto3 with a custom endpoint.
    This service maintains the same interface as the previous S3Service for
    seamless integration with existing upload handlers.
    """
    
    def __init__(self):
        """Initialize R2/S3 client."""
        self.s3_client = None
        self.bucket_name = settings.R2_BUCKET_NAME or settings.S3_BUCKET_NAME
        self.public_url = (settings.R2_PUBLIC_URL or "").rstrip('/')
        
        # Determine which credentials to use (prefer R2, fallback to legacy AWS)
        account_id = settings.R2_ACCOUNT_ID
        access_key = settings.R2_ACCESS_KEY_ID or settings.AWS_ACCESS_KEY_ID
        secret_key = settings.R2_SECRET_ACCESS_KEY or settings.AWS_SECRET_ACCESS_KEY
        
        # Only initialize if R2 credentials are provided
        if account_id and access_key and secret_key:
            try:
                # Cloudflare R2 endpoint format
                endpoint_url = f"https://{account_id}.r2.cloudflarestorage.com"
                
                self.s3_client = boto3.client(
                    's3',
                    endpoint_url=endpoint_url,
                    aws_access_key_id=access_key,
                    aws_secret_access_key=secret_key,
                    region_name='auto',  # R2 uses 'auto' for region
                    config=Config(
                        signature_version='s3v4',
                        s3={'addressing_style': 'path'}  # R2 prefers path-style addressing
                    )
                )
                logger.info(f"R2 client initialized for bucket: {self.bucket_name}")
            except Exception as e:
                logger.error(f"Failed to initialize R2 client: {str(e)}")
                self.s3_client = None
        else:
            logger.warning(
                "R2 credentials not provided. File uploads will use local storage. "
                "Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_PUBLIC_URL for production."
            )
    
    def is_available(self) -> bool:
        """Check if R2 service is available."""
        return self.s3_client is not None and bool(self.bucket_name) and bool(self.public_url)
    
    def upload_file(
        self, 
        file_content: bytes, 
        file_key: str, 
        content_type: str = 'application/octet-stream'
    ) -> Optional[str]:
        """
        Upload file to R2.
        
        Args:
            file_content: File content as bytes
            file_key: R2 key (path) for the file
            content_type: MIME type of the file
            
        Returns:
            Public URL of uploaded file, or None if upload failed
        """
        if not self.is_available():
            logger.error("R2 service not available - check credentials and R2_PUBLIC_URL")
            return None
        
        try:
            # Upload to R2
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=file_key,
                Body=file_content,
                ContentType=content_type
            )
            
            # Generate public URL using the configured public URL
            url = f"{self.public_url}/{file_key}"
            logger.info(f"File uploaded successfully to R2: {url}")
            return url
            
        except ClientError as e:
            logger.error(f"R2 upload failed: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during R2 upload: {str(e)}")
            return None
    
    def delete_file(self, file_key: str) -> bool:
        """
        Delete file from R2.
        
        Args:
            file_key: R2 key (path) of the file
            
        Returns:
            True if deleted successfully, False otherwise
        """
        if not self.is_available():
            logger.error("R2 service not available")
            return False
        
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=file_key
            )
            logger.info(f"File deleted successfully from R2: {file_key}")
            return True
            
        except ClientError as e:
            logger.error(f"R2 delete failed: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during R2 delete: {str(e)}")
            return False
    
    def get_presigned_url(self, file_key: str, expiration: int = 3600) -> Optional[str]:
        """
        Generate a presigned URL for temporary access to a private file.
        
        Note: For R2 with public buckets, you typically don't need presigned URLs.
        This is mainly useful for private buckets or temporary access tokens.
        
        Args:
            file_key: R2 key (path) of the file
            expiration: URL expiration time in seconds
            
        Returns:
            Presigned URL or None if generation failed
        """
        if not self.is_available():
            logger.error("R2 service not available")
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

    def file_exists(self, file_key: str) -> bool:
        """
        Check if a file exists in R2.
        
        Args:
            file_key: R2 key (path) of the file
            
        Returns:
            True if file exists, False otherwise
        """
        if not self.is_available():
            return False
        
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=file_key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            logger.error(f"Error checking file existence: {str(e)}")
            return False


# Singleton instance - named s3_service for backwards compatibility with uploads.py
s3_service = R2Service()
