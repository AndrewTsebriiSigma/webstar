"""Admin router for platform management."""
from datetime import datetime
from typing import Optional, List
import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, func
from pydantic import BaseModel

from app.db.base import get_session
from app.db.models import User, Profile, PortfolioItem, Project, Report, AdminAction, OnboardingProgress, UserPoints
from app.core.security import get_current_user
from app.core.config import settings

router = APIRouter()


# ============================================================================
# SCHEMAS
# ============================================================================

class AdminStats(BaseModel):
    total_users: int
    users_today: int
    users_this_week: int
    total_profiles: int
    total_portfolio_items: int
    total_projects: int
    pending_reports: int
    banned_users: int


class UserAdminView(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    role: str
    is_active: bool
    is_banned: bool
    ban_reason: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True


class ReportView(BaseModel):
    id: int
    reporter_id: Optional[int]
    target_type: str
    target_id: int
    target_user_id: int
    target_username: Optional[str] = None
    reason: str
    description: Optional[str]
    status: str
    resolved_by: Optional[int]
    resolved_at: Optional[str]
    resolution_note: Optional[str]
    created_at: str


class BanUserRequest(BaseModel):
    reason: str


class ResolveReportRequest(BaseModel):
    resolution_note: Optional[str] = None
    action: str = "resolve"  # resolve, dismiss


class RoleChangeRequest(BaseModel):
    new_role: str  # user, moderator, admin


class SetupFirstAdminRequest(BaseModel):
    secret_key: str
    user_id: int


# ============================================================================
# PERMISSION HELPERS
# ============================================================================

def require_moderator(current_user: User = Depends(get_current_user)) -> User:
    """Require at least moderator role."""
    if current_user.role not in ["moderator", "admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Moderator access required"
        )
    if current_user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is banned"
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require at least admin role."""
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    if current_user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is banned"
        )
    return current_user


def require_super_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require super_admin role."""
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required"
        )
    return current_user


def log_admin_action(
    session: Session,
    admin_id: int,
    action_type: str,
    target_type: str,
    target_id: int,
    details: Optional[dict] = None,
    ip_address: Optional[str] = None
):
    """Log an admin action for audit trail."""
    action = AdminAction(
        admin_id=admin_id,
        action_type=action_type,
        target_type=target_type,
        target_id=target_id,
        details=json.dumps(details) if details else None,
        ip_address=ip_address
    )
    session.add(action)
    session.commit()


# ============================================================================
# SETUP FIRST ADMIN (One-time use)
# ============================================================================

@router.post("/setup-first-admin")
async def setup_first_admin(
    data: SetupFirstAdminRequest,
    session: Session = Depends(get_session)
):
    """Set up the first super_admin. Only works when no super_admin exists."""
    # Check secret key from environment
    admin_secret = getattr(settings, 'ADMIN_SETUP_SECRET', 'webstar-admin-setup-2024')
    if data.secret_key != admin_secret:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid secret key"
        )
    
    # Check if any super_admin exists
    existing_super_admin = session.exec(
        select(User).where(User.role == "super_admin")
    ).first()
    
    if existing_super_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Super admin already exists"
        )
    
    # Get the user to promote
    user = session.get(User, data.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Promote to super_admin
    user.role = "super_admin"
    session.add(user)
    session.commit()
    
    return {"message": f"User {user.username} is now super_admin"}


# ============================================================================
# DASHBOARD & STATS
# ============================================================================

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_moderator)
):
    """Get platform-wide statistics."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    # Simple week calculation
    from datetime import timedelta
    week_start = today_start - timedelta(days=7)
    
    total_users = session.exec(select(func.count(User.id))).one()
    users_today = session.exec(
        select(func.count(User.id)).where(User.created_at >= today_start)
    ).one()
    users_this_week = session.exec(
        select(func.count(User.id)).where(User.created_at >= week_start)
    ).one()
    total_profiles = session.exec(select(func.count(Profile.id))).one()
    total_portfolio = session.exec(select(func.count(PortfolioItem.id))).one()
    total_projects = session.exec(select(func.count(Project.id))).one()
    pending_reports = session.exec(
        select(func.count(Report.id)).where(Report.status == "pending")
    ).one()
    banned_users = session.exec(
        select(func.count(User.id)).where(User.is_banned == True)
    ).one()
    
    return AdminStats(
        total_users=total_users,
        users_today=users_today,
        users_this_week=users_this_week,
        total_profiles=total_profiles,
        total_portfolio_items=total_portfolio,
        total_projects=total_projects,
        pending_reports=pending_reports,
        banned_users=banned_users
    )


@router.get("/activity")
async def get_admin_activity(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_moderator),
    limit: int = Query(default=50, le=100)
):
    """Get recent admin activity log."""
    actions = session.exec(
        select(AdminAction)
        .order_by(AdminAction.created_at.desc())
        .limit(limit)
    ).all()
    
    result = []
    for action in actions:
        admin = session.get(User, action.admin_id)
        result.append({
            "id": action.id,
            "admin_id": action.admin_id,
            "admin_username": admin.username if admin else "Unknown",
            "action_type": action.action_type,
            "target_type": action.target_type,
            "target_id": action.target_id,
            "details": json.loads(action.details) if action.details else None,
            "created_at": action.created_at.isoformat()
        })
    
    return result


# ============================================================================
# USERS MANAGEMENT
# ============================================================================

@router.get("/users")
async def list_users(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_moderator),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    banned: Optional[bool] = None
):
    """List all users with filtering."""
    query = select(User)
    
    if search:
        query = query.where(
            (User.username.contains(search)) |
            (User.email.contains(search)) |
            (User.full_name.contains(search))
        )
    
    if role:
        query = query.where(User.role == role)
    
    if banned is not None:
        query = query.where(User.is_banned == banned)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = session.exec(count_query).one()
    
    # Get paginated results
    offset = (page - 1) * limit
    users = session.exec(
        query.order_by(User.created_at.desc()).offset(offset).limit(limit)
    ).all()
    
    return {
        "users": [
            UserAdminView(
                id=u.id,
                email=u.email,
                username=u.username,
                full_name=u.full_name,
                role=u.role,
                is_active=u.is_active,
                is_banned=u.is_banned,
                ban_reason=u.ban_reason,
                created_at=u.created_at.isoformat()
            ) for u in users
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_moderator)
):
    """Get detailed user information."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = session.exec(
        select(Profile).where(Profile.user_id == user_id)
    ).first()
    
    onboarding = session.exec(
        select(OnboardingProgress).where(OnboardingProgress.user_id == user_id)
    ).first()
    
    points = session.exec(
        select(UserPoints).where(UserPoints.user_id == user_id)
    ).first()
    
    portfolio_count = session.exec(
        select(func.count(PortfolioItem.id)).where(PortfolioItem.user_id == user_id)
    ).one()
    
    project_count = session.exec(
        select(func.count(Project.id)).where(Project.user_id == user_id)
    ).one()
    
    report_count = session.exec(
        select(func.count(Report.id)).where(Report.target_user_id == user_id)
    ).one()
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "is_active": user.is_active,
            "is_banned": user.is_banned,
            "ban_reason": user.ban_reason,
            "banned_at": user.banned_at.isoformat() if user.banned_at else None,
            "oauth_provider": user.oauth_provider,
            "is_2fa_enabled": user.is_2fa_enabled,
            "created_at": user.created_at.isoformat()
        },
        "profile": {
            "display_name": profile.display_name if profile else None,
            "role": profile.role if profile else None,
            "bio": profile.bio if profile else None,
            "location": profile.location if profile else None,
            "profile_views": profile.profile_views_count if profile else 0
        } if profile else None,
        "onboarding_completed": onboarding.completed if onboarding else False,
        "total_points": points.total_points if points else 0,
        "portfolio_count": portfolio_count,
        "project_count": project_count,
        "reports_against": report_count
    }


@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: int,
    request: BanUserRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Ban a user."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Can't ban admins unless you're super_admin
    if user.role in ["admin", "super_admin"] and current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot ban admin users"
        )
    
    # Can't ban yourself
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot ban yourself"
        )
    
    user.is_banned = True
    user.banned_at = datetime.utcnow()
    user.banned_by = current_user.id
    user.ban_reason = request.reason
    session.add(user)
    session.commit()
    
    # Log action
    log_admin_action(
        session, current_user.id, "ban", "user", user_id,
        {"reason": request.reason, "username": user.username}
    )
    
    return {"message": f"User {user.username} has been banned"}


@router.post("/users/{user_id}/unban")
async def unban_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Unban a user."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not banned"
        )
    
    user.is_banned = False
    user.banned_at = None
    user.banned_by = None
    user.ban_reason = None
    session.add(user)
    session.commit()
    
    # Log action
    log_admin_action(
        session, current_user.id, "unban", "user", user_id,
        {"username": user.username}
    )
    
    return {"message": f"User {user.username} has been unbanned"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin)
):
    """Delete a user account (super_admin only)."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    username = user.username
    
    # Delete related records
    session.exec(select(Profile).where(Profile.user_id == user_id)).delete()
    session.exec(select(PortfolioItem).where(PortfolioItem.user_id == user_id)).delete()
    session.exec(select(Project).where(Project.user_id == user_id)).delete()
    session.exec(select(OnboardingProgress).where(OnboardingProgress.user_id == user_id)).delete()
    session.exec(select(UserPoints).where(UserPoints.user_id == user_id)).delete()
    
    session.delete(user)
    session.commit()
    
    # Log action
    log_admin_action(
        session, current_user.id, "delete", "user", user_id,
        {"username": username}
    )
    
    return {"message": f"User {username} has been deleted"}


# ============================================================================
# REPORTS MANAGEMENT
# ============================================================================

@router.get("/reports")
async def list_reports(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_moderator),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, le=100),
    status_filter: Optional[str] = Query(default=None, alias="status"),
    target_type: Optional[str] = None
):
    """List all reports."""
    query = select(Report)
    
    if status_filter:
        query = query.where(Report.status == status_filter)
    
    if target_type:
        query = query.where(Report.target_type == target_type)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = session.exec(count_query).one()
    
    # Get paginated results
    offset = (page - 1) * limit
    reports = session.exec(
        query.order_by(Report.created_at.desc()).offset(offset).limit(limit)
    ).all()
    
    result = []
    for r in reports:
        target_user = session.get(User, r.target_user_id)
        result.append(ReportView(
            id=r.id,
            reporter_id=r.reporter_id,
            target_type=r.target_type,
            target_id=r.target_id,
            target_user_id=r.target_user_id,
            target_username=target_user.username if target_user else None,
            reason=r.reason,
            description=r.description,
            status=r.status,
            resolved_by=r.resolved_by,
            resolved_at=r.resolved_at.isoformat() if r.resolved_at else None,
            resolution_note=r.resolution_note,
            created_at=r.created_at.isoformat()
        ))
    
    return {
        "reports": result,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }


@router.get("/reports/{report_id}")
async def get_report_detail(
    report_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_moderator)
):
    """Get detailed report information."""
    report = session.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    target_user = session.get(User, report.target_user_id)
    reporter = session.get(User, report.reporter_id) if report.reporter_id else None
    resolver = session.get(User, report.resolved_by) if report.resolved_by else None
    
    # Get target content details
    target_content = None
    if report.target_type == "profile":
        profile = session.exec(
            select(Profile).where(Profile.user_id == report.target_id)
        ).first()
        if profile:
            target_content = {
                "display_name": profile.display_name,
                "bio": profile.bio,
                "location": profile.location
            }
    elif report.target_type == "portfolio":
        item = session.get(PortfolioItem, report.target_id)
        if item:
            target_content = {
                "title": item.title,
                "description": item.description,
                "content_type": item.content_type,
                "content_url": item.content_url
            }
    elif report.target_type == "project":
        project = session.get(Project, report.target_id)
        if project:
            target_content = {
                "title": project.title,
                "description": project.description,
                "cover_image": project.cover_image
            }
    
    return {
        "report": {
            "id": report.id,
            "target_type": report.target_type,
            "target_id": report.target_id,
            "reason": report.reason,
            "description": report.description,
            "status": report.status,
            "resolution_note": report.resolution_note,
            "created_at": report.created_at.isoformat(),
            "resolved_at": report.resolved_at.isoformat() if report.resolved_at else None
        },
        "target_user": {
            "id": target_user.id,
            "username": target_user.username,
            "email": target_user.email,
            "is_banned": target_user.is_banned
        } if target_user else None,
        "reporter": {
            "id": reporter.id,
            "username": reporter.username
        } if reporter else {"anonymous": True},
        "resolver": {
            "id": resolver.id,
            "username": resolver.username
        } if resolver else None,
        "target_content": target_content
    }


@router.put("/reports/{report_id}/resolve")
async def resolve_report(
    report_id: int,
    request: ResolveReportRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_moderator)
):
    """Resolve or dismiss a report."""
    report = session.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report.status not in ["pending", "reviewing"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Report already resolved"
        )
    
    report.status = "resolved" if request.action == "resolve" else "dismissed"
    report.resolved_by = current_user.id
    report.resolved_at = datetime.utcnow()
    report.resolution_note = request.resolution_note
    session.add(report)
    session.commit()
    
    # Log action
    log_admin_action(
        session, current_user.id, f"report_{request.action}", "report", report_id,
        {"reason": report.reason, "target_type": report.target_type}
    )
    
    return {"message": f"Report has been {report.status}"}


# ============================================================================
# CONTENT MANAGEMENT
# ============================================================================

@router.get("/portfolio")
async def list_portfolio_items(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_moderator),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, le=100),
    user_id: Optional[int] = None
):
    """List portfolio items for moderation."""
    query = select(PortfolioItem)
    
    if user_id:
        query = query.where(PortfolioItem.user_id == user_id)
    
    count_query = select(func.count()).select_from(query.subquery())
    total = session.exec(count_query).one()
    
    offset = (page - 1) * limit
    items = session.exec(
        query.order_by(PortfolioItem.created_at.desc()).offset(offset).limit(limit)
    ).all()
    
    result = []
    for item in items:
        user = session.get(User, item.user_id)
        result.append({
            "id": item.id,
            "user_id": item.user_id,
            "username": user.username if user else "Unknown",
            "content_type": item.content_type,
            "title": item.title,
            "description": item.description,
            "content_url": item.content_url,
            "views": item.views,
            "created_at": item.created_at.isoformat()
        })
    
    return {
        "items": result,
        "total": total,
        "page": page,
        "limit": limit
    }


@router.delete("/portfolio/{item_id}")
async def delete_portfolio_item(
    item_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_moderator)
):
    """Delete a portfolio item."""
    item = session.get(PortfolioItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    
    user = session.get(User, item.user_id)
    session.delete(item)
    session.commit()
    
    # Log action
    log_admin_action(
        session, current_user.id, "delete", "portfolio", item_id,
        {"title": item.title, "owner": user.username if user else "Unknown"}
    )
    
    return {"message": "Portfolio item deleted"}


@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_moderator)
):
    """Delete a project."""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    user = session.get(User, project.user_id)
    session.delete(project)
    session.commit()
    
    # Log action
    log_admin_action(
        session, current_user.id, "delete", "project", project_id,
        {"title": project.title, "owner": user.username if user else "Unknown"}
    )
    
    return {"message": "Project deleted"}


# ============================================================================
# ADMIN TEAM MANAGEMENT (Super Admin Only)
# ============================================================================

@router.get("/admins")
async def list_admins(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin)
):
    """List all admin users."""
    admins = session.exec(
        select(User).where(User.role.in_(["moderator", "admin", "super_admin"]))
        .order_by(User.role.desc(), User.created_at)
    ).all()
    
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at.isoformat()
        } for u in admins
    ]


@router.post("/admins/{user_id}/promote")
async def promote_user(
    user_id: int,
    request: RoleChangeRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin)
):
    """Promote a user to admin/moderator role."""
    if request.new_role not in ["moderator", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'moderator' or 'admin'"
        )
    
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == "super_admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify super_admin role"
        )
    
    old_role = user.role
    user.role = request.new_role
    session.add(user)
    session.commit()
    
    # Log action
    log_admin_action(
        session, current_user.id, "role_change", "user", user_id,
        {"username": user.username, "old_role": old_role, "new_role": request.new_role}
    )
    
    return {"message": f"User {user.username} is now {request.new_role}"}


@router.post("/admins/{user_id}/demote")
async def demote_user(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_super_admin)
):
    """Demote an admin/moderator to regular user."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == "super_admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot demote super_admin"
        )
    
    if user.role == "user":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a regular user"
        )
    
    old_role = user.role
    user.role = "user"
    session.add(user)
    session.commit()
    
    # Log action
    log_admin_action(
        session, current_user.id, "role_change", "user", user_id,
        {"username": user.username, "old_role": old_role, "new_role": "user"}
    )
    
    return {"message": f"User {user.username} is now a regular user"}
