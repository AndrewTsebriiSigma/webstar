"""Projects router."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db.base import get_session
from app.db.models import User, Project, ProjectMedia, Profile, PointsTransaction, UserPoints
from app.deps.auth import get_current_user
from app.schemas.portfolio import (
    ProjectCreate, ProjectUpdate, ProjectResponse,
    ProjectMediaCreate, ProjectMediaResponse
)

router = APIRouter()


async def award_points_project(user_id: int, action: str, points: int, session: Session):
    """Award points for project actions."""
    transaction = PointsTransaction(
        user_id=user_id,
        points=points,
        action=action,
        description=f"Project: {action}"
    )
    session.add(transaction)
    
    user_points = session.exec(select(UserPoints).where(UserPoints.user_id == user_id)).first()
    if user_points:
        user_points.total_points += points
        user_points.available_points += points
        session.add(user_points)
    
    session.commit()


@router.get("/", response_model=List[ProjectResponse])
async def get_projects(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Get user's projects."""
    projects = session.exec(
        select(Project)
        .where(Project.user_id == current_user.id)
        .order_by(Project.order)
    ).all()
    
    result = []
    for project in projects:
        media_count = len(session.exec(
            select(ProjectMedia).where(ProjectMedia.project_id == project.id)
        ).all())
        
        result.append(ProjectResponse(
            id=project.id,
            user_id=project.user_id,
            title=project.title,
            description=project.description,
            cover_image=project.cover_image,
            tags=project.tags,
            tools=project.tools,
            project_url=project.project_url,
            views=project.views,
            clicks=project.clicks,
            order=project.order,
            media_count=media_count,
            created_at=project.created_at.isoformat()
        ))
    
    return result


@router.get("/user/{username}", response_model=List[ProjectResponse])
async def get_user_projects(
    username: str,
    session: Session = Depends(get_session)
):
    """Get another user's projects (public)."""
    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    projects = session.exec(
        select(Project)
        .where(Project.user_id == user.id)
        .order_by(Project.order)
    ).all()
    
    result = []
    for project in projects:
        media_count = len(session.exec(
            select(ProjectMedia).where(ProjectMedia.project_id == project.id)
        ).all())
        
        result.append(ProjectResponse(
            id=project.id,
            user_id=project.user_id,
            title=project.title,
            description=project.description,
            cover_image=project.cover_image,
            tags=project.tags,
            tools=project.tools,
            project_url=project.project_url,
            views=project.views,
            clicks=project.clicks,
            order=project.order,
            media_count=media_count,
            created_at=project.created_at.isoformat()
        ))
    
    return result


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Create a new project."""
    # Get current max order
    existing = session.exec(
        select(Project).where(Project.user_id == current_user.id)
    ).all()
    order = len(existing)
    
    # Create project
    project = Project(
        user_id=current_user.id,
        title=project_data.title,
        description=project_data.description,
        cover_image=project_data.cover_image,
        tags=project_data.tags,
        tools=project_data.tools,
        project_url=project_data.project_url,
        order=order
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    
    # Update profile projects count
    profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
    if profile:
        profile.projects_count += 1
        session.add(profile)
        session.commit()
    
    # Award points for first project
    if len(existing) == 0:
        await award_points_project(current_user.id, "first_project", 100, session)
    
    return ProjectResponse(
        id=project.id,
        user_id=project.user_id,
        title=project.title,
        description=project.description,
        cover_image=project.cover_image,
        tags=project.tags,
        tools=project.tools,
        project_url=project.project_url,
        views=project.views,
        clicks=project.clicks,
        order=project.order,
        media_count=0,
        created_at=project.created_at.isoformat()
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    session: Session = Depends(get_session)
):
    """Get a project by ID."""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    media_count = len(session.exec(
        select(ProjectMedia).where(ProjectMedia.project_id == project.id)
    ).all())
    
    return ProjectResponse(
        id=project.id,
        user_id=project.user_id,
        title=project.title,
        description=project.description,
        cover_image=project.cover_image,
        tags=project.tags,
        tools=project.tools,
        project_url=project.project_url,
        views=project.views,
        clicks=project.clicks,
        order=project.order,
        media_count=media_count,
        created_at=project.created_at.isoformat()
    )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    updates: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update a project."""
    project = session.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if updates.title is not None:
        project.title = updates.title
    if updates.description is not None:
        project.description = updates.description
    if updates.cover_image is not None:
        project.cover_image = updates.cover_image
    if updates.tags is not None:
        project.tags = updates.tags
    if updates.tools is not None:
        project.tools = updates.tools
    if updates.project_url is not None:
        project.project_url = updates.project_url
    if updates.order is not None:
        project.order = updates.order
    
    session.add(project)
    session.commit()
    session.refresh(project)
    
    media_count = len(session.exec(
        select(ProjectMedia).where(ProjectMedia.project_id == project.id)
    ).all())
    
    return ProjectResponse(
        id=project.id,
        user_id=project.user_id,
        title=project.title,
        description=project.description,
        cover_image=project.cover_image,
        tags=project.tags,
        tools=project.tools,
        project_url=project.project_url,
        views=project.views,
        clicks=project.clicks,
        order=project.order,
        media_count=media_count,
        created_at=project.created_at.isoformat()
    )


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete a project."""
    project = session.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Delete all media
    media_items = session.exec(select(ProjectMedia).where(ProjectMedia.project_id == project.id)).all()
    for media in media_items:
        session.delete(media)
    
    session.delete(project)
    
    # Update profile projects count
    profile = session.exec(select(Profile).where(Profile.user_id == current_user.id)).first()
    if profile:
        profile.projects_count = max(0, profile.projects_count - 1)
        session.add(profile)
    
    session.commit()
    
    return {"message": "Project deleted successfully"}


@router.get("/{project_id}/media", response_model=List[ProjectMediaResponse])
async def get_project_media(
    project_id: int,
    session: Session = Depends(get_session)
):
    """Get media items for a project."""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    media_items = session.exec(
        select(ProjectMedia)
        .where(ProjectMedia.project_id == project_id)
        .order_by(ProjectMedia.order)
    ).all()
    
    return [
        ProjectMediaResponse(
            id=media.id,
            project_id=media.project_id,
            media_url=media.media_url,
            media_type=media.media_type,
            thumbnail_url=media.thumbnail_url,
            order=media.order,
            created_at=media.created_at.isoformat()
        )
        for media in media_items
    ]


@router.post("/{project_id}/media", response_model=ProjectMediaResponse, status_code=status.HTTP_201_CREATED)
async def add_project_media(
    project_id: int,
    media_data: ProjectMediaCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Add media to a project."""
    project = session.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get current max order
    existing = session.exec(
        select(ProjectMedia).where(ProjectMedia.project_id == project_id)
    ).all()
    order = len(existing)
    
    # Create media
    media = ProjectMedia(
        project_id=project_id,
        media_url=media_data.media_url,
        media_type=media_data.media_type,
        thumbnail_url=media_data.thumbnail_url,
        order=order
    )
    session.add(media)
    session.commit()
    session.refresh(media)
    
    return ProjectMediaResponse(
        id=media.id,
        project_id=media.project_id,
        media_url=media.media_url,
        media_type=media.media_type,
        thumbnail_url=media.thumbnail_url,
        order=media.order,
        created_at=media.created_at.isoformat()
    )


@router.delete("/{project_id}/media/{media_id}")
async def delete_project_media(
    project_id: int,
    media_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Delete media from a project."""
    project = session.get(Project, project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    
    media = session.get(ProjectMedia, media_id)
    if not media or media.project_id != project_id:
        raise HTTPException(status_code=404, detail="Media not found")
    
    session.delete(media)
    session.commit()
    
    return {"message": "Media deleted successfully"}


@router.post("/{project_id}/view")
async def track_project_view(
    project_id: int,
    session: Session = Depends(get_session)
):
    """Track a view on a project."""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.views += 1
    session.add(project)
    session.commit()
    
    return {"message": "View tracked"}


@router.post("/{project_id}/click")
async def track_project_click(
    project_id: int,
    session: Session = Depends(get_session)
):
    """Track a click on a project."""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.clicks += 1
    session.add(project)
    session.commit()
    
    return {"message": "Click tracked"}

