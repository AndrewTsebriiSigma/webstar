"""Media compression service using FFmpeg for video, audio, and image optimization.

This service compresses media files before uploading to R2 storage to reduce
storage costs and bandwidth usage while maintaining quality for display.

Compression Standards:
- Video: H.264 (MPEG-4 AVC) + AAC audio in MP4 container
- Images: WebP (preferred) or optimized JPEG
- Audio: AAC in M4A container
"""
import os
import uuid
import subprocess
import tempfile
import logging
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class CompressionResult:
    """Result of media compression."""
    success: bool
    compressed_content: Optional[bytes] = None
    output_filename: str = ""
    original_size: int = 0
    compressed_size: int = 0
    content_type: str = ""
    error: Optional[str] = None
    
    @property
    def compression_ratio(self) -> float:
        """Calculate compression ratio (0.0 to 1.0)."""
        if self.original_size == 0:
            return 0
        return 1 - (self.compressed_size / self.original_size)
    
    @property
    def savings_percent(self) -> str:
        """Human-readable savings percentage."""
        return f"{self.compression_ratio * 100:.1f}%"


class MediaCompressionService:
    """Service for compressing media files using FFmpeg.
    
    Uses H.264/AAC for universal browser compatibility.
    Maintains original resolution for display quality while optimizing file size.
    """
    
    # Video compression presets (H.264)
    # CRF: 0=lossless, 51=worst. 18-28 is typical range.
    VIDEO_PRESETS = {
        "high": {
            "crf": 20,
            "preset": "slow",
            "max_width": 1920,
            "max_height": 1080,
            "audio_bitrate": "192k",
            "video_bitrate": "4M"
        },
        "standard": {
            "crf": 23,
            "preset": "medium",
            "max_width": 1920,
            "max_height": 1080,
            "audio_bitrate": "128k",
            "video_bitrate": "2M"
        },
        "low": {
            "crf": 28,
            "preset": "fast",
            "max_width": 1280,
            "max_height": 720,
            "audio_bitrate": "96k",
            "video_bitrate": "1M"
        },
    }
    
    # Image quality presets (1-100 scale)
    IMAGE_PRESETS = {
        "high": {"quality": 90, "max_dimension": 2560},
        "standard": {"quality": 85, "max_dimension": 1920},
        "low": {"quality": 75, "max_dimension": 1280},
    }
    
    # Audio compression presets (AAC)
    AUDIO_PRESETS = {
        "high": {"bitrate": "192k", "sample_rate": 48000},
        "standard": {"bitrate": "128k", "sample_rate": 44100},
        "low": {"bitrate": "96k", "sample_rate": 44100},
    }
    
    def __init__(self):
        """Initialize the compression service."""
        self.ffmpeg_available = self._check_ffmpeg()
        self.ffprobe_available = self._check_ffprobe()
        
        if self.ffmpeg_available:
            logger.info("FFmpeg compression service initialized successfully")
        else:
            logger.warning(
                "FFmpeg not found on system. Media compression will be disabled. "
                "Install FFmpeg for production use: apt-get install ffmpeg"
            )
    
    def _check_ffmpeg(self) -> bool:
        """Check if FFmpeg is available on the system."""
        try:
            result = subprocess.run(
                ["ffmpeg", "-version"],
                capture_output=True,
                timeout=30  # First run can be slow
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
            return False
    
    def _check_ffprobe(self) -> bool:
        """Check if FFprobe is available (for media analysis)."""
        try:
            result = subprocess.run(
                ["ffprobe", "-version"],
                capture_output=True,
                timeout=30  # First run can be slow
            )
            return result.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
            return False
    
    def is_available(self) -> bool:
        """Check if compression service is available."""
        return self.ffmpeg_available
    
    def get_media_info(self, file_path: str) -> Optional[dict]:
        """Get media file information using FFprobe."""
        if not self.ffprobe_available:
            return None
        
        try:
            cmd = [
                "ffprobe",
                "-v", "quiet",
                "-print_format", "json",
                "-show_format",
                "-show_streams",
                file_path
            ]
            result = subprocess.run(cmd, capture_output=True, timeout=30)
            if result.returncode == 0:
                import json
                return json.loads(result.stdout.decode())
        except Exception as e:
            logger.debug(f"Could not get media info: {e}")
        return None
    
    def compress_video(
        self,
        content: bytes,
        original_filename: str,
        preset: str = "standard"
    ) -> CompressionResult:
        """
        Compress video using H.264/AAC in MP4 container.
        
        This is the industry standard for web video with universal browser support.
        Maintains original resolution up to preset max, optimizes bitrate.
        
        Args:
            content: Raw video bytes
            original_filename: Original filename for extension detection
            preset: Quality preset (high, standard, low)
            
        Returns:
            CompressionResult with compressed video
        """
        if not self.ffmpeg_available:
            return CompressionResult(
                success=False,
                error="FFmpeg not available on this system",
                original_size=len(content)
            )
        
        settings = self.VIDEO_PRESETS.get(preset, self.VIDEO_PRESETS["standard"])
        original_size = len(content)
        
        # Get input extension
        input_ext = Path(original_filename).suffix.lower() if original_filename else ".mp4"
        if not input_ext:
            input_ext = ".mp4"
        
        input_file = None
        output_file = None
        
        try:
            # Write input to temp file
            with tempfile.NamedTemporaryFile(suffix=input_ext, delete=False) as f:
                f.write(content)
                input_file = f.name
            
            # Output file (always MP4 for compatibility)
            output_file = tempfile.mktemp(suffix=".mp4")
            
            # Build FFmpeg command for H.264 compression
            # Scale filter: maintains aspect ratio, scales down if larger than max
            scale_filter = (
                f"scale='min({settings['max_width']},iw)':'min({settings['max_height']},ih)':"
                f"force_original_aspect_ratio=decrease"
            )
            
            cmd = [
                "ffmpeg",
                "-i", input_file,
                "-c:v", "libx264",                    # H.264 video codec
                "-preset", settings["preset"],        # Encoding speed/quality tradeoff
                "-crf", str(settings["crf"]),         # Constant Rate Factor (quality)
                "-maxrate", settings["video_bitrate"], # Max bitrate cap
                "-bufsize", settings["video_bitrate"], # Buffer size
                "-vf", scale_filter,                  # Scale if needed
                "-c:a", "aac",                        # AAC audio codec
                "-b:a", settings["audio_bitrate"],    # Audio bitrate
                "-ac", "2",                           # Stereo audio
                "-movflags", "+faststart",            # Web optimization (metadata at start)
                "-pix_fmt", "yuv420p",                # Pixel format for compatibility
                "-y",                                 # Overwrite output
                output_file
            ]
            
            logger.info(f"Compressing video: {original_filename} ({original_size/1024/1024:.2f}MB)")
            logger.debug(f"FFmpeg command: {' '.join(cmd)}")
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                timeout=600  # 10 minute timeout for large videos
            )
            
            if result.returncode != 0:
                error_msg = result.stderr.decode() if result.stderr else "Unknown FFmpeg error"
                logger.error(f"FFmpeg video compression failed: {error_msg[:500]}")
                return CompressionResult(
                    success=False,
                    error=f"Video compression failed: {error_msg[:200]}",
                    original_size=original_size
                )
            
            # Read compressed output
            with open(output_file, "rb") as f:
                compressed_content = f.read()
            
            compressed_size = len(compressed_content)
            output_filename = f"{uuid.uuid4()}.mp4"
            
            # Only use compressed version if it's actually smaller
            if compressed_size >= original_size:
                logger.info(f"Compression did not reduce size, using original")
                return CompressionResult(
                    success=True,
                    compressed_content=content,
                    output_filename=f"{uuid.uuid4()}{input_ext}",
                    original_size=original_size,
                    compressed_size=original_size,
                    content_type="video/mp4"
                )
            
            logger.info(
                f"Video compressed successfully: "
                f"{original_size/1024/1024:.2f}MB -> {compressed_size/1024/1024:.2f}MB "
                f"({(1-compressed_size/original_size)*100:.1f}% reduction)"
            )
            
            return CompressionResult(
                success=True,
                compressed_content=compressed_content,
                output_filename=output_filename,
                original_size=original_size,
                compressed_size=compressed_size,
                content_type="video/mp4"
            )
            
        except subprocess.TimeoutExpired:
            logger.error("Video compression timed out (exceeded 10 minutes)")
            return CompressionResult(
                success=False,
                error="Video compression timed out. File may be too large.",
                original_size=original_size
            )
        except Exception as e:
            logger.error(f"Video compression error: {str(e)}")
            return CompressionResult(
                success=False,
                error=str(e),
                original_size=original_size
            )
        finally:
            # Cleanup temp files
            if input_file and os.path.exists(input_file):
                try:
                    os.unlink(input_file)
                except Exception:
                    pass
            if output_file and os.path.exists(output_file):
                try:
                    os.unlink(output_file)
                except Exception:
                    pass
    
    def compress_image(
        self,
        content: bytes,
        original_filename: str,
        preset: str = "standard",
        output_format: str = "webp"
    ) -> CompressionResult:
        """
        Compress image using FFmpeg.
        
        WebP provides best compression with transparency support.
        Falls back to JPEG for maximum compatibility.
        
        Args:
            content: Raw image bytes
            original_filename: Original filename
            preset: Quality preset (high, standard, low)
            output_format: Output format (webp recommended, jpeg fallback)
            
        Returns:
            CompressionResult with compressed image
        """
        if not self.ffmpeg_available:
            return CompressionResult(
                success=False,
                error="FFmpeg not available on this system",
                original_size=len(content)
            )
        
        settings = self.IMAGE_PRESETS.get(preset, self.IMAGE_PRESETS["standard"])
        original_size = len(content)
        
        input_ext = Path(original_filename).suffix.lower() if original_filename else ".jpg"
        if not input_ext:
            input_ext = ".jpg"
        
        input_file = None
        output_file = None
        
        try:
            # Write input to temp file
            with tempfile.NamedTemporaryFile(suffix=input_ext, delete=False) as f:
                f.write(content)
                input_file = f.name
            
            # Determine output format and extension
            if output_format == "webp":
                output_ext = ".webp"
                content_type = "image/webp"
            else:
                output_ext = ".jpg"
                content_type = "image/jpeg"
            
            output_file = tempfile.mktemp(suffix=output_ext)
            
            # Scale filter: maintain aspect ratio, limit to max dimension
            max_dim = settings["max_dimension"]
            scale_filter = f"scale='min({max_dim},iw)':'min({max_dim},ih)':force_original_aspect_ratio=decrease"
            
            # Build FFmpeg command
            if output_format == "webp":
                cmd = [
                    "ffmpeg",
                    "-i", input_file,
                    "-vf", scale_filter,
                    "-quality", str(settings["quality"]),
                    "-compression_level", "4",  # Balance speed/size
                    "-y",
                    output_file
                ]
            else:
                # JPEG: q:v scale is 2-31 (lower = better)
                jpeg_quality = max(2, int(31 - (settings["quality"] / 100 * 29)))
                cmd = [
                    "ffmpeg",
                    "-i", input_file,
                    "-vf", scale_filter,
                    "-q:v", str(jpeg_quality),
                    "-y",
                    output_file
                ]
            
            logger.info(f"Compressing image: {original_filename} ({original_size/1024:.1f}KB)")
            
            result = subprocess.run(cmd, capture_output=True, timeout=60)
            
            if result.returncode != 0:
                error_msg = result.stderr.decode() if result.stderr else "Unknown error"
                logger.error(f"FFmpeg image compression failed: {error_msg[:300]}")
                return CompressionResult(
                    success=False,
                    error=f"Image compression failed: {error_msg[:200]}",
                    original_size=original_size
                )
            
            # Read compressed output
            with open(output_file, "rb") as f:
                compressed_content = f.read()
            
            compressed_size = len(compressed_content)
            output_filename = f"{uuid.uuid4()}{output_ext}"
            
            # Only use compressed if smaller
            if compressed_size >= original_size:
                logger.info(f"Compression did not reduce size, using original")
                return CompressionResult(
                    success=True,
                    compressed_content=content,
                    output_filename=f"{uuid.uuid4()}{input_ext}",
                    original_size=original_size,
                    compressed_size=original_size,
                    content_type=content_type
                )
            
            logger.info(
                f"Image compressed: {original_size/1024:.1f}KB -> {compressed_size/1024:.1f}KB "
                f"({(1-compressed_size/original_size)*100:.1f}% reduction)"
            )
            
            return CompressionResult(
                success=True,
                compressed_content=compressed_content,
                output_filename=output_filename,
                original_size=original_size,
                compressed_size=compressed_size,
                content_type=content_type
            )
            
        except subprocess.TimeoutExpired:
            logger.error("Image compression timed out")
            return CompressionResult(
                success=False,
                error="Image compression timed out",
                original_size=original_size
            )
        except Exception as e:
            logger.error(f"Image compression error: {str(e)}")
            return CompressionResult(
                success=False,
                error=str(e),
                original_size=original_size
            )
        finally:
            if input_file and os.path.exists(input_file):
                try:
                    os.unlink(input_file)
                except Exception:
                    pass
            if output_file and os.path.exists(output_file):
                try:
                    os.unlink(output_file)
                except Exception:
                    pass
    
    def compress_audio(
        self,
        content: bytes,
        original_filename: str,
        preset: str = "standard"
    ) -> CompressionResult:
        """
        Compress audio to AAC format in M4A container.
        
        AAC provides excellent quality at lower bitrates than MP3.
        M4A container is universally supported.
        
        Args:
            content: Raw audio bytes
            original_filename: Original filename
            preset: Quality preset (high, standard, low)
            
        Returns:
            CompressionResult with compressed audio
        """
        if not self.ffmpeg_available:
            return CompressionResult(
                success=False,
                error="FFmpeg not available on this system",
                original_size=len(content)
            )
        
        settings = self.AUDIO_PRESETS.get(preset, self.AUDIO_PRESETS["standard"])
        original_size = len(content)
        
        input_ext = Path(original_filename).suffix.lower() if original_filename else ".mp3"
        if not input_ext:
            input_ext = ".mp3"
        
        input_file = None
        output_file = None
        
        try:
            # Write input to temp file
            with tempfile.NamedTemporaryFile(suffix=input_ext, delete=False) as f:
                f.write(content)
                input_file = f.name
            
            # Output file (AAC in M4A container for compatibility)
            output_file = tempfile.mktemp(suffix=".m4a")
            
            # FFmpeg command for AAC compression
            cmd = [
                "ffmpeg",
                "-i", input_file,
                "-c:a", "aac",                        # AAC codec
                "-b:a", settings["bitrate"],          # Audio bitrate
                "-ar", str(settings["sample_rate"]),  # Sample rate
                "-ac", "2",                           # Stereo
                "-y",
                output_file
            ]
            
            logger.info(f"Compressing audio: {original_filename} ({original_size/1024/1024:.2f}MB)")
            
            result = subprocess.run(cmd, capture_output=True, timeout=180)  # 3 min timeout
            
            if result.returncode != 0:
                error_msg = result.stderr.decode() if result.stderr else "Unknown error"
                logger.error(f"FFmpeg audio compression failed: {error_msg[:300]}")
                return CompressionResult(
                    success=False,
                    error=f"Audio compression failed: {error_msg[:200]}",
                    original_size=original_size
                )
            
            # Read compressed output
            with open(output_file, "rb") as f:
                compressed_content = f.read()
            
            compressed_size = len(compressed_content)
            output_filename = f"{uuid.uuid4()}.m4a"
            
            # Only use compressed if smaller
            if compressed_size >= original_size:
                logger.info(f"Compression did not reduce size, using original")
                return CompressionResult(
                    success=True,
                    compressed_content=content,
                    output_filename=f"{uuid.uuid4()}{input_ext}",
                    original_size=original_size,
                    compressed_size=original_size,
                    content_type="audio/mpeg"
                )
            
            logger.info(
                f"Audio compressed: {original_size/1024/1024:.2f}MB -> {compressed_size/1024/1024:.2f}MB "
                f"({(1-compressed_size/original_size)*100:.1f}% reduction)"
            )
            
            return CompressionResult(
                success=True,
                compressed_content=compressed_content,
                output_filename=output_filename,
                original_size=original_size,
                compressed_size=compressed_size,
                content_type="audio/mp4"  # M4A MIME type
            )
            
        except subprocess.TimeoutExpired:
            logger.error("Audio compression timed out")
            return CompressionResult(
                success=False,
                error="Audio compression timed out",
                original_size=original_size
            )
        except Exception as e:
            logger.error(f"Audio compression error: {str(e)}")
            return CompressionResult(
                success=False,
                error=str(e),
                original_size=original_size
            )
        finally:
            if input_file and os.path.exists(input_file):
                try:
                    os.unlink(input_file)
                except Exception:
                    pass
            if output_file and os.path.exists(output_file):
                try:
                    os.unlink(output_file)
                except Exception:
                    pass


# Singleton instance
compression_service = MediaCompressionService()

