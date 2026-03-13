"""Pydantic models for API request/response schemas."""

from datetime import datetime, date
from typing import Any, Generic, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field

T = TypeVar("T")


# ------------------------------------------------------------------
# Pagination
# ------------------------------------------------------------------

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    per_page: int


# ------------------------------------------------------------------
# Sources
# ------------------------------------------------------------------

class SourceResponse(BaseModel):
    id: UUID
    name: str
    url: Optional[str] = None
    reliability_score: Optional[float] = None
    bias_rating: Optional[str] = None
    category: Optional[str] = Field(None, description="Source type (rss, reddit, gnews, etc.)")


# ------------------------------------------------------------------
# Articles
# ------------------------------------------------------------------

class ArticleResponse(BaseModel):
    id: UUID
    title: str
    url: str
    description: Optional[str] = Field(None, description="Article summary")
    image_url: Optional[str] = None
    source_name: Optional[str] = None
    source_bias: Optional[str] = None
    published_at: Optional[datetime] = None
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None
    bias_score: Optional[float] = None
    bias_label: Optional[str] = None
    verification_level: int = 0
    ai_summary: Optional[str] = None
    entities: Optional[dict[str, Any]] = None
    power_level: Optional[float] = None
    source_count: int = 1
    read_time_minutes: Optional[int] = None


class FactCheckResponse(BaseModel):
    id: UUID
    claim_text: str
    verdict: Optional[str] = None
    source_url: Optional[str] = None
    checked_at: Optional[datetime] = None


class SourceConfirmationResponse(BaseModel):
    id: UUID
    confirming_source_name: Optional[str] = None
    confirming_url: Optional[str] = None
    similarity_score: Optional[float] = None
    confirmed_at: Optional[datetime] = None


class ArticleDetailResponse(ArticleResponse):
    fact_checks: list[FactCheckResponse] = []
    source_confirmations: list[SourceConfirmationResponse] = []
    related_articles: list[ArticleResponse] = []


# ------------------------------------------------------------------
# Topics
# ------------------------------------------------------------------

class TopicResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    article_count: int = 0
    power_level: float = 0.0
    trending_since: Optional[datetime] = None


class TrendingResponse(BaseModel):
    topics: list[TopicResponse]
    last_updated: datetime


class TopicTimelineEntry(BaseModel):
    date: date
    article_count: int


# ------------------------------------------------------------------
# Globe
# ------------------------------------------------------------------

class GlobeEvent(BaseModel):
    lat: float
    lng: float
    tone: float
    title: str
    url: str


class HeatmapEntry(BaseModel):
    country_code: str
    sentiment_avg: float
    article_count: int


class ArcEntry(BaseModel):
    origin: str
    destination: str
    weight: int


# ------------------------------------------------------------------
# Users & Gamification
# ------------------------------------------------------------------

class UserProfileResponse(BaseModel):
    id: UUID
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    rank: str = "Academy Student"
    xp: int = 0
    streak_days: int = 0
    achievements: list[str] = []


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: UUID
    display_name: Optional[str] = None
    xp: int = 0
    rank_name: str = "Academy Student"


class ReadingLogRequest(BaseModel):
    article_id: UUID
    time_spent_seconds: int = 0


class AchievementResponse(BaseModel):
    achievement_id: str
    unlocked_at: datetime


# ------------------------------------------------------------------
# Quiz
# ------------------------------------------------------------------

class QuizQuestion(BaseModel):
    id: str
    question: str
    options: list[str]
    article_id: Optional[UUID] = None


class QuizSubmission(BaseModel):
    answers: dict[str, int] = Field(
        ..., description="Mapping of question_id to selected option index"
    )


class QuizResult(BaseModel):
    score: int
    total: int
    xp_earned: int
    correct_answers: dict[str, int]


# ------------------------------------------------------------------
# What-If Scenarios
# ------------------------------------------------------------------

class WhatIfResponse(BaseModel):
    id: UUID
    article_id: Optional[UUID] = None
    scenario: str
    confidence: Optional[float] = None
    implications: Optional[str] = None
    community_votes_agree: int = 0
    community_votes_disagree: int = 0


class WhatIfVoteRequest(BaseModel):
    vote: str = Field(..., pattern="^(agree|disagree)$")


class WhatIfSuggestRequest(BaseModel):
    article_id: Optional[UUID] = None
    scenario: str


# ------------------------------------------------------------------
# Stories (Reels)
# ------------------------------------------------------------------

class StoryResponse(BaseModel):
    id: UUID
    headline: str
    summary: Optional[str] = None
    image_url: Optional[str] = None
    article_id: Optional[UUID] = None
    created_at: Optional[datetime] = None


# ------------------------------------------------------------------
# Reactions
# ------------------------------------------------------------------

class ReactionRequest(BaseModel):
    emoji: str = Field(..., min_length=1, max_length=10)
