"""Economy/Gamification schemas."""
from pydantic import BaseModel
from typing import List


class PointsBalance(BaseModel):
    """User's points balance."""
    total_points: int
    available_points: int


class PointsTransaction(BaseModel):
    """Points transaction."""
    id: int
    points: int
    action: str
    description: str | None
    created_at: str


class PointsHistory(BaseModel):
    """Points transaction history."""
    balance: PointsBalance
    transactions: List[PointsTransaction]


class RewardItem(BaseModel):
    """Available reward."""
    id: str
    name: str
    description: str
    cost: int
    category: str  # 'boost', 'theme', 'feature'
    available: bool

