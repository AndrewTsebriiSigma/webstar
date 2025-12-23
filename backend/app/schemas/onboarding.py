"""Onboarding schemas."""
from pydantic import BaseModel, Field
from typing import Optional


class ArchetypeSelection(BaseModel):
    """Archetype selection."""
    archetype: str = Field(..., description="Engineer, Artist, Sound-Maker, or Communicator")


class RoleSelection(BaseModel):
    """Role selection."""
    role: str = Field(..., description="User's professional role")


class ExpertiseSelection(BaseModel):
    """Expertise level selection."""
    expertise_level: str = Field(..., description="Expertise level semantic label")


class OnboardingStatus(BaseModel):
    """Onboarding status response."""
    archetype: Optional[str]
    role: Optional[str]
    expertise_level: Optional[str]
    completed: bool
    completed_at: Optional[str]


class CompleteOnboarding(BaseModel):
    """Complete onboarding in one request."""
    archetype: str
    role: str
    expertise_level: str

