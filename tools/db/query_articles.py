"""Query articles from Supabase database."""

import os
import sys
from typing import Optional

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", os.getenv("SUPABASE_KEY"))


def get_client() -> Client:
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env")
        sys.exit(1)
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def get_latest_articles(client: Client, limit: int = 20, offset: int = 0,
                        topic: Optional[str] = None, source_id: Optional[str] = None,
                        min_verification: int = 0) -> list:
    """Get latest articles with optional filters."""
    query = client.table("articles").select(
        "*, sources(name, bias_rating, reliability_score)"
    ).gte("verification_level", min_verification).order(
        "published_at", desc=True
    ).range(offset, offset + limit - 1)

    if topic:
        query = query.contains("topics", [topic])
    if source_id:
        query = query.eq("source_id", source_id)

    result = query.execute()
    return result.data


def search_articles(client: Client, query_text: str, limit: int = 20) -> list:
    """Full-text search on articles."""
    result = client.table("articles").select(
        "*, sources(name, bias_rating)"
    ).text_search("search_vector", query_text).limit(limit).execute()
    return result.data


def get_article_by_id(client: Client, article_id: str) -> Optional[dict]:
    """Get a single article with all related data."""
    result = client.table("articles").select(
        "*, sources(name, type, bias_rating, reliability_score)"
    ).eq("id", article_id).single().execute()
    return result.data


def get_trending_topics(client: Client, limit: int = 10) -> list:
    """Get top trending topics by power level."""
    result = client.table("topics").select("*").order(
        "power_level", desc=True
    ).limit(limit).execute()
    return result.data


def get_topic_articles(client: Client, topic_slug: str, limit: int = 20) -> list:
    """Get articles for a specific topic."""
    topic = client.table("topics").select("id").eq("slug", topic_slug).single().execute()
    if not topic.data:
        return []

    result = client.table("article_topics").select(
        "relevance_score, articles(*, sources(name, bias_rating))"
    ).eq("topic_id", topic.data["id"]).order(
        "relevance_score", desc=True
    ).limit(limit).execute()
    return result.data


def get_article_fact_checks(client: Client, article_id: str) -> list:
    """Get fact checks for an article."""
    result = client.table("fact_checks").select("*").eq(
        "article_id", article_id
    ).execute()
    return result.data


def get_source_confirmations(client: Client, article_id: str) -> list:
    """Get cross-source confirmations for an article."""
    result = client.table("source_confirmations").select(
        "*, sources(name)"
    ).eq("article_id", article_id).execute()
    return result.data


def get_unanalyzed_articles(client: Client, limit: int = 50) -> list:
    """Get articles that haven't been analyzed yet."""
    result = client.table("articles").select("id, title, content, url").is_(
        "sentiment_score", "null"
    ).order("scraped_at", desc=True).limit(limit).execute()
    return result.data


def get_unverified_articles(client: Client, limit: int = 50) -> list:
    """Get articles with verification_level 0."""
    result = client.table("articles").select(
        "id, title, url, source_id, published_at"
    ).eq("verification_level", 0).order(
        "scraped_at", desc=True
    ).limit(limit).execute()
    return result.data


def get_leaderboard(client: Client, limit: int = 20) -> list:
    """Get top users by XP."""
    result = client.table("user_xp").select(
        "*, user_profiles(display_name, avatar_url, ninja_rank)"
    ).order("total_xp", desc=True).limit(limit).execute()
    return result.data


if __name__ == "__main__":
    client = get_client()
    articles = get_latest_articles(client, limit=5)
    print(f"Latest {len(articles)} articles:")
    for a in articles:
        print(f"  - {a['title'][:80]}")
