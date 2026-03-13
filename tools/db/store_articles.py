"""Store articles in Supabase database."""

import os
import sys
from datetime import datetime, timezone
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


def ensure_source(client: Client, name: str, source_type: str, url: Optional[str] = None,
                  bias_rating: Optional[str] = None, reliability_score: Optional[float] = None) -> str:
    """Get or create a source, return its ID."""
    result = client.table("sources").select("id").eq("name", name).execute()
    if result.data:
        return result.data[0]["id"]

    data = {
        "name": name,
        "type": source_type,
        "url": url,
        "bias_rating": bias_rating,
        "reliability_score": reliability_score,
    }
    result = client.table("sources").insert(data).execute()
    return result.data[0]["id"]


def store_article(client: Client, article: dict) -> Optional[str]:
    """Store a single article. Returns article ID or None if duplicate."""
    required = ["title", "url", "source_id"]
    for field in required:
        if field not in article:
            print(f"Warning: Missing required field '{field}', skipping")
            return None

    data = {
        "title": article["title"],
        "url": article["url"],
        "source_id": article["source_id"],
        "content": article.get("content"),
        "summary": article.get("summary"),
        "image_url": article.get("image_url"),
        "author": article.get("author"),
        "published_at": article.get("published_at"),
        "metadata": article.get("metadata", {}),
    }

    try:
        result = client.table("articles").insert(data).execute()
        return result.data[0]["id"]
    except Exception as e:
        if "duplicate key" in str(e).lower() or "unique" in str(e).lower():
            return None  # Duplicate URL, skip silently
        print(f"Error storing article: {e}")
        return None


def store_articles_batch(client: Client, articles: list[dict]) -> dict:
    """Store multiple articles. Returns counts of stored/skipped."""
    stored = 0
    skipped = 0
    for article in articles:
        result = store_article(client, article)
        if result:
            stored += 1
        else:
            skipped += 1
    return {"stored": stored, "skipped": skipped}


def update_source_fetched(client: Client, source_id: str):
    """Update last_fetched_at for a source."""
    client.table("sources").update({
        "last_fetched_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", source_id).execute()


if __name__ == "__main__":
    client = get_client()
    print("Database connection successful")
    # Quick test: count articles
    result = client.table("articles").select("id", count="exact").execute()
    print(f"Total articles in database: {result.count}")
