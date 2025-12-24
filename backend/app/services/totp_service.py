"""TOTP (Time-based One-Time Password) service for 2FA."""
import pyotp
import qrcode
import io
import base64
from typing import Optional


class TOTPService:
    """Service for handling 2FA with TOTP (compatible with Microsoft Authenticator)."""
    
    @staticmethod
    def generate_secret() -> str:
        """Generate a new TOTP secret."""
        return pyotp.random_base32()
    
    @staticmethod
    def generate_qr_code(secret: str, username: str, issuer: str = "WebStar") -> str:
        """
        Generate QR code for TOTP setup.
        Returns base64 encoded PNG image.
        """
        # Create TOTP URI
        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(name=username, issuer_name=issuer)
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(uri)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    
    @staticmethod
    def verify_token(secret: str, token: str) -> bool:
        """
        Verify a TOTP token.
        
        Args:
            secret: User's TOTP secret
            token: 6-digit code from authenticator app
            
        Returns:
            True if valid, False otherwise
        """
        try:
            totp = pyotp.TOTP(secret)
            # Allow a window of ±1 time steps (30 seconds each) for clock drift
            return totp.verify(token, valid_window=1)
        except Exception:
            return False
    
    @staticmethod
    def get_current_token(secret: str) -> str:
        """
        Get current TOTP token (for testing purposes only).
        
        Args:
            secret: User's TOTP secret
            
        Returns:
            Current 6-digit token
        """
        totp = pyotp.TOTP(secret)
        return totp.now()

