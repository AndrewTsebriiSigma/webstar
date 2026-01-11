"""File validation service using magic bytes.

Provides secure file type validation to prevent upload of malicious files.
"""
import magic
from pathlib import Path
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)


# Allowed file types with their MIME types and extensions
ALLOWED_IMAGE_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif']
}

ALLOWED_VIDEO_TYPES = {
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov'],
    'video/x-msvideo': ['.avi'],
    'video/mpeg': ['.mpeg', '.mpg']
}

ALLOWED_AUDIO_TYPES = {
    'audio/mpeg': ['.mp3'],
    'audio/mp4': ['.m4a'],
    'audio/x-m4a': ['.m4a'],
    'audio/wav': ['.wav'],
    'audio/ogg': ['.ogg']
}

ALLOWED_DOCUMENT_TYPES = {
    'application/pdf': ['.pdf']
}


class FileValidator:
    """Validates file types using magic bytes (actual file content)."""
    
    @staticmethod
    def validate_file_type(
        content: bytes,
        filename: str,
        allowed_types: Dict[str, List[str]],
        check_extension: bool = True
    ) -> Tuple[bool, str, str]:
        """
        Validate file type using magic bytes and extension.
        
        Args:
            content: File content as bytes
            filename: Original filename
            allowed_types: Dict of allowed MIME types and their extensions
            check_extension: Whether to verify extension matches MIME type
        
        Returns:
            Tuple of (is_valid, detected_mime_type, error_message)
        """
        try:
            # Detect actual MIME type from file content (magic bytes)
            mime = magic.from_buffer(content, mime=True)
            
            logger.info(f"Validating file '{filename}': detected MIME type = {mime}")
            
            # Check if detected MIME type is allowed
            if mime not in allowed_types:
                return False, mime, f"File type '{mime}' is not allowed"
            
            if check_extension:
                # Verify file extension matches detected MIME type
                ext = Path(filename).suffix.lower()
                
                if ext not in allowed_types[mime]:
                    return False, mime, (
                        f"File extension '{ext}' does not match detected type '{mime}'. "
                        f"Expected: {', '.join(allowed_types[mime])}"
                    )
            
            logger.info(f"File validation passed: {filename} ({mime})")
            return True, mime, ""
            
        except Exception as e:
            logger.error(f"File validation error for '{filename}': {str(e)}")
            return False, "unknown", f"File validation failed: {str(e)}"
    
    @staticmethod
    def validate_image(content: bytes, filename: str) -> Tuple[bool, str, str]:
        """Validate image file."""
        return FileValidator.validate_file_type(
            content, filename, ALLOWED_IMAGE_TYPES, check_extension=True
        )
    
    @staticmethod
    def validate_video(content: bytes, filename: str) -> Tuple[bool, str, str]:
        """Validate video file."""
        return FileValidator.validate_file_type(
            content, filename, ALLOWED_VIDEO_TYPES, check_extension=True
        )
    
    @staticmethod
    def validate_audio(content: bytes, filename: str) -> Tuple[bool, str, str]:
        """Validate audio file."""
        return FileValidator.validate_file_type(
            content, filename, ALLOWED_AUDIO_TYPES, check_extension=True
        )
    
    @staticmethod
    def validate_pdf(content: bytes, filename: str) -> Tuple[bool, str, str]:
        """Validate PDF file."""
        return FileValidator.validate_file_type(
            content, filename, ALLOWED_DOCUMENT_TYPES, check_extension=True
        )
    
    @staticmethod
    def is_svg(content: bytes) -> bool:
        """
        Check if file is SVG.
        
        SVG files are XML-based and can contain JavaScript, making them
        potential XSS vectors. Block them by default.
        """
        try:
            mime = magic.from_buffer(content, mime=True)
            return mime == 'image/svg+xml' or mime == 'text/xml' and b'<svg' in content[:1000]
        except:
            return False


# Singleton instance
file_validator = FileValidator()
