"""Authentication router."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from authlib.integrations.starlette_client import OAuth
from starlette.requests import Request
import secrets

from app.db.base import get_session
from app.db.models import User, Profile, OnboardingProgress, UserPoints
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token, get_current_user
from app.core.config import settings
from app.schemas.auth import UserRegister, UserLogin, Token, RefreshToken, GoogleAuth, UserResponse, LoginResponse, Verify2FALoginRequest, ProfileSetup
from app.services.totp_service import TOTPService
from datetime import timedelta

router = APIRouter()

# Initialize OAuth
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Store for OAuth state tokens (in production, use Redis or database)
oauth_states = {}


@router.post("/register", response_model=Token)
async def register(user_data: UserRegister, session: Session = Depends(get_session)):
    """Register a new user with email and password."""
    # Check if email exists
    existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username exists
    existing_username = session.exec(select(User).where(User.username == user_data.username)).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create user
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Create profile
    profile = Profile(user_id=user.id, display_name=user_data.full_name)
    session.add(profile)
    
    # Create onboarding progress
    onboarding = OnboardingProgress(user_id=user.id)
    session.add(onboarding)
    
    # Create points account
    points = UserPoints(user_id=user.id)
    session.add(points)
    
    session.commit()
    
    # Create tokens
    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
            onboarding_completed=False,
            profile_setup_completed=True
        )
    )


@router.post("/setup-profile", response_model=UserResponse)
async def setup_profile(
    profile_data: ProfileSetup,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Complete profile setup for OAuth users (set username and name)."""
    # Check if username is already taken
    existing_username = session.exec(
        select(User).where(
            (User.username == profile_data.username) & (User.id != current_user.id)
        )
    ).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Validate username format (alphanumeric, underscore, 3-20 chars)
    import re
    if not re.match(r'^[a-zA-Z0-9_]{3,20}$', profile_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be 3-20 characters and contain only letters, numbers, and underscores"
        )
    
    # Update user
    current_user.username = profile_data.username
    current_user.full_name = profile_data.full_name
    current_user.profile_setup_completed = True
    session.add(current_user)
    
    # Update profile display name
    profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
    if profile:
        profile.display_name = profile_data.full_name
        session.add(profile)
    
    session.commit()
    session.refresh(current_user)
    
    # Check onboarding status
    onboarding = session.exec(select(OnboardingProgress).where(OnboardingProgress.user_id == current_user.id)).first()
    onboarding_completed = onboarding.completed if onboarding else False
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        created_at=current_user.created_at.isoformat(),
        onboarding_completed=onboarding_completed,
        profile_setup_completed=True
    )


@router.get("/google")
async def google_login(request: Request):
    """Initiate Google OAuth flow."""
    # Generate state token for CSRF protection
    state = secrets.token_urlsafe(32)
    oauth_states[state] = True
    
    # Get the redirect URI from settings
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    
    # Redirect to Google OAuth
    return await oauth.google.authorize_redirect(request, redirect_uri, state=state)


@router.get("/google/callback")
async def google_callback(request: Request, session: Session = Depends(get_session)):
    """Handle Google OAuth callback."""
    try:
        # Verify state parameter (CSRF protection)
        state = request.query_params.get('state')
        if not state or state not in oauth_states:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid state parameter"
            )
        
        # Remove used state
        oauth_states.pop(state, None)
        
        # Get the authorization token
        token = await oauth.google.authorize_access_token(request)
        
        # Get user info from Google
        user_info = token.get('userinfo')
        if not user_info:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to get user info from Google"
            )
        
        google_id = user_info['sub']
        email = user_info['email']
        name = user_info.get('name', '')
        email_verified = user_info.get('email_verified', False)
        
        # Check if user exists with this Google ID
        user = session.exec(select(User).where(User.google_id == google_id)).first()
        
        if not user:
            # Check if email exists (account linking)
            user = session.exec(select(User).where(User.email == email)).first()
            if user:
                # Link Google account to existing user
                user.google_id = google_id
                user.oauth_provider = 'google'
                session.add(user)
                session.commit()
            else:
                # Create new user with temporary username
                # Generate temporary username (will be changed in profile setup)
                temp_username = f"temp_{secrets.token_urlsafe(8)}"
                
                user = User(
                    email=email,
                    username=temp_username,
                    full_name=name or '',  # Store name from Google, can be edited
                    google_id=google_id,
                    oauth_provider='google',
                    is_active=True,
                    profile_setup_completed=False  # New OAuth users need to set username
                )
                session.add(user)
                session.commit()
                session.refresh(user)
                
                # Create profile
                profile = Profile(user_id=user.id, display_name=name)
                session.add(profile)
                
                # Create onboarding progress
                onboarding = OnboardingProgress(user_id=user.id)
                session.add(onboarding)
                
                # Create points account
                points = UserPoints(user_id=user.id)
                session.add(points)
                
                session.commit()
        
        # Check onboarding and profile setup status
        onboarding = session.exec(select(OnboardingProgress).where(OnboardingProgress.user_id == user.id)).first()
        onboarding_completed = onboarding.completed if onboarding else False
        profile_setup_completed = user.profile_setup_completed
        
        # Create tokens
        access_token = create_access_token({"sub": user.id})
        refresh_token_str = create_refresh_token({"sub": user.id})
        
        # Get the first CORS origin (frontend URL)
        frontend_url = settings.CORS_ORIGINS[0] if isinstance(settings.CORS_ORIGINS, list) else settings.CORS_ORIGINS.split(',')[0].strip()
        
        # Always redirect to the callback page first
        redirect_url = f"{frontend_url}/auth/callback/google"
        redirect_url += f"?access_token={access_token}&refresh_token={refresh_token_str}&user_id={user.id}&username={user.username}&email={user.email}&full_name={user.full_name or ''}&onboarding_completed={onboarding_completed}&profile_setup_completed={profile_setup_completed}"
        
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        # Log the error for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"OAuth callback error: {str(e)}", exc_info=True)
        
        # Get the first CORS origin (frontend URL)
        frontend_url = settings.CORS_ORIGINS[0] if isinstance(settings.CORS_ORIGINS, list) else settings.CORS_ORIGINS.split(',')[0].strip()
        
        # Redirect to frontend callback with error
        error_url = f"{frontend_url}/auth/callback/google?error=oauth_failed&message={str(e)}"
        return RedirectResponse(url=error_url)


@router.post("/login", response_model=LoginResponse)
async def login(user_data: UserLogin, session: Session = Depends(get_session)):
    """Login with email or username and password. May require 2FA verification."""
    # Find user by email OR username
    user = session.exec(
        select(User).where(
            (User.email == user_data.email) | (User.username == user_data.email)
        )
    ).first()
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/username or password"
        )
    
    # Verify password
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Check if 2FA is enabled
    if user.is_2fa_enabled and user.totp_secret:
        # Generate a temporary token for 2FA verification
        temp_token = create_access_token(
            data={"sub": user.id, "type": "pending_2fa"},
            expires_delta=timedelta(minutes=5)
        )
        
        return LoginResponse(
            requires_2fa=True,
            temp_token=temp_token,
            message="Please enter your 2FA code to complete login"
        )
    
    # No 2FA required, proceed with normal login
    # Check onboarding status
    onboarding = session.exec(select(OnboardingProgress).where(OnboardingProgress.user_id == user.id)).first()
    onboarding_completed = onboarding.completed if onboarding else False
    
    # Create tokens
    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    
    return LoginResponse(
        requires_2fa=False,
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
            onboarding_completed=onboarding_completed
        )
    )


@router.post("/google", response_model=Token)
async def google_auth(auth_data: GoogleAuth, session: Session = Depends(get_session)):
    """Authenticate with Google OAuth."""
    try:
        # Verify Google token
        idinfo = id_token.verify_oauth2_token(
            auth_data.token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        
        # Check if user exists
        user = session.exec(select(User).where(User.google_id == google_id)).first()
        
        if not user:
            # Check if email exists (linking account)
            user = session.exec(select(User).where(User.email == email)).first()
            if user:
                # Link Google account
                user.google_id = google_id
                user.oauth_provider = 'google'
                session.add(user)
                session.commit()
            else:
                # Create new user
                # Generate username from email
                username = email.split('@')[0]
                # Ensure username is unique
                counter = 1
                original_username = username
                while session.exec(select(User).where(User.username == username)).first():
                    username = f"{original_username}{counter}"
                    counter += 1
                
                user = User(
                    email=email,
                    username=username,
                    full_name=name,
                    google_id=google_id,
                    oauth_provider='google'
                )
                session.add(user)
                session.commit()
                session.refresh(user)
                
                # Create profile
                profile = Profile(user_id=user.id, display_name=name)
                session.add(profile)
                
                # Create onboarding progress
                onboarding = OnboardingProgress(user_id=user.id)
                session.add(onboarding)
                
                # Create points account
                points = UserPoints(user_id=user.id)
                session.add(points)
                
                session.commit()
        
        # Check onboarding status
        onboarding = session.exec(select(OnboardingProgress).where(OnboardingProgress.user_id == user.id)).first()
        onboarding_completed = onboarding.completed if onboarding else False
        
        # Create tokens
        access_token = create_access_token({"sub": user.id})
        refresh_token = create_refresh_token({"sub": user.id})
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserResponse(
                id=user.id,
                email=user.email,
                username=user.username,
                full_name=user.full_name,
                is_active=user.is_active,
                created_at=user.created_at.isoformat(),
                onboarding_completed=onboarding_completed
            )
        )
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google token: {str(e)}"
        )


@router.post("/verify-2fa", response_model=Token)
async def verify_2fa_login(
    request: Verify2FALoginRequest,
    session: Session = Depends(get_session)
):
    """Verify 2FA code and complete login."""
    # Decode the temporary token
    payload = decode_token(request.temp_token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Verify it's a pending_2fa token
    if payload.get("type") != "pending_2fa":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    # Get user ID from token
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    # Get user from database
    user = session.get(User, user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user"
        )
    
    # Verify user has 2FA enabled and has a secret
    if not user.is_2fa_enabled or not user.totp_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="2FA not enabled for this account"
        )
    
    # Verify the TOTP code
    if not TOTPService.verify_token(user.totp_secret, request.totp_code):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid 2FA code"
        )
    
    # 2FA verification successful, generate full tokens
    # Check onboarding status
    onboarding = session.exec(select(OnboardingProgress).where(OnboardingProgress.user_id == user.id)).first()
    onboarding_completed = onboarding.completed if onboarding else False
    
    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
            onboarding_completed=onboarding_completed
        )
    )


@router.post("/refresh", response_model=Token)
async def refresh(token_data: RefreshToken, session: Session = Depends(get_session)):
    """Refresh access token."""
    payload = decode_token(token_data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Get user
    user = session.get(User, int(user_id))
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Check onboarding status
    onboarding = session.exec(select(OnboardingProgress).where(OnboardingProgress.user_id == user.id)).first()
    onboarding_completed = onboarding.completed if onboarding else False
    
    # Create new tokens
    access_token = create_access_token({"sub": user.id})
    refresh_token = create_refresh_token({"sub": user.id})
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
            onboarding_completed=onboarding_completed
        )
    )

