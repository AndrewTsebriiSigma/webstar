"""Email service for sending verification codes."""
import smtplib
import random
import string
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from app.core.config import settings

# Setup proper logging for production visibility
logger = logging.getLogger(__name__)


def generate_verification_code() -> str:
    """Generate a 6-digit verification code."""
    return ''.join(random.choices(string.digits, k=6))


def send_verification_email(to_email: str, code: str) -> bool:
    """Send verification code via Gmail SMTP."""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f'🌟 WebStar - Your verification code: {code}'
        msg['From'] = f'{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>'
        msg['To'] = to_email

        # Plain text version
        text = f"""
WebStar Email Verification

Your verification code is: {code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

— The WebStar Team
        """

        # HTML version
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0B0B0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0B0B0C; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px;">
                    <!-- Logo -->
                    <tr>
                        <td align="center" style="padding-bottom: 32px;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #00C2FF;">
                                WebSTAR
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Card -->
                    <tr>
                        <td style="background: #161618; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 40px 32px;">
                            <h2 style="margin: 0 0 8px 0; color: rgba(255, 255, 255, 0.95); font-size: 24px; font-weight: 600; text-align: center;">
                                Verify your email
                            </h2>
                            <p style="margin: 0 0 32px 0; color: rgba(255, 255, 255, 0.5); font-size: 14px; text-align: center;">
                                Enter this code to complete your registration
                            </p>
                            
                            <!-- Code Box -->
                            <div style="background: rgba(0, 194, 255, 0.1); border: 2px solid rgba(0, 194, 255, 0.3); border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
                                <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #00C2FF; font-family: 'SF Mono', Monaco, monospace;">
                                    {code}
                                </span>
                            </div>
                            
                            <p style="margin: 0; color: rgba(255, 255, 255, 0.4); font-size: 13px; text-align: center;">
                                This code expires in <strong style="color: rgba(255, 255, 255, 0.6);">10 minutes</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding-top: 32px; text-align: center;">
                            <p style="margin: 0; color: rgba(255, 255, 255, 0.3); font-size: 12px;">
                                If you didn't request this code, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """

        msg.attach(MIMEText(text, 'plain'))
        msg.attach(MIMEText(html, 'html'))

        # Connect to Gmail SMTP
        logger.info(f"Attempting to send verification email to {to_email}")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        
        logger.info(f"Verification email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send verification email to {to_email}: {str(e)}", exc_info=True)
        return False


def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """Send password reset email via Gmail SMTP."""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = '🔐 WebStar - Reset your password'
        msg['From'] = f'{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>'
        msg['To'] = to_email

        # Plain text version
        text = f"""
WebStar Password Reset

Click the link below to reset your password:

{reset_link}

This link will expire in 1 hour.

If you didn't request this, please ignore this email. Your password will not be changed.

— The WebStar Team
        """

        # HTML version
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0B0B0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0B0B0C; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px;">
                    <!-- Logo -->
                    <tr>
                        <td align="center" style="padding-bottom: 32px;">
                            <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #00C2FF;">
                                WebSTAR
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Card -->
                    <tr>
                        <td style="background: #161618; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 40px 32px;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <div style="width: 64px; height: 64px; margin: 0 auto; background: rgba(0, 194, 255, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                    <span style="font-size: 28px;">🔐</span>
                                </div>
                            </div>
                            
                            <h2 style="margin: 0 0 8px 0; color: rgba(255, 255, 255, 0.95); font-size: 24px; font-weight: 600; text-align: center;">
                                Reset your password
                            </h2>
                            <p style="margin: 0 0 32px 0; color: rgba(255, 255, 255, 0.5); font-size: 14px; text-align: center;">
                                Click the button below to set a new password
                            </p>
                            
                            <!-- Button -->
                            <div style="text-align: center; margin-bottom: 24px;">
                                <a href="{reset_link}" style="display: inline-block; background: linear-gradient(135deg, #00C2FF 0%, #0A84FF 100%); color: white; text-decoration: none; padding: 14px 48px; border-radius: 12px; font-weight: 600; font-size: 15px;">
                                    Reset password
                                </a>
                            </div>
                            
                            <p style="margin: 0; color: rgba(255, 255, 255, 0.4); font-size: 13px; text-align: center;">
                                This link expires in <strong style="color: rgba(255, 255, 255, 0.6);">1 hour</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding-top: 32px; text-align: center;">
                            <p style="margin: 0 0 8px 0; color: rgba(255, 255, 255, 0.3); font-size: 12px;">
                                If you didn't request this, you can safely ignore this email.
                            </p>
                            <p style="margin: 0; color: rgba(255, 255, 255, 0.2); font-size: 11px;">
                                Can't click the button? Copy this link:<br/>
                                <span style="color: rgba(0, 194, 255, 0.6); word-break: break-all;">{reset_link}</span>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """

        msg.attach(MIMEText(text, 'plain'))
        msg.attach(MIMEText(html, 'html'))

        # Connect to Gmail SMTP
        logger.info(f"Attempting to send password reset email to {to_email}")
        logger.info(f"SMTP Config: host={settings.SMTP_HOST}, port={settings.SMTP_PORT}, user={settings.SMTP_USER}")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        
        logger.info(f"Password reset email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {to_email}: {str(e)}", exc_info=True)
        return False
