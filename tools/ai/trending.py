"""Calculate trending topics based on article volume, recency, and social signals.

Usage:
    python tools/ai/trending.py [--update] [--limit 20]

Power level formula:
    (article_count * 10) + (avg_social_score * 5) + recency_bonus

Recency bonus per article:
    < 1 hour  = 50
    < 3 hours = 30
    < 6 hours = 15
    < 12 hours = 5
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone, timedelta

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


def _get_client():
    """Get Supabase client."""
    from tools.db.query_articles import get_client
    return get_client()


def _recency_bonus(published_at: str | None) -> float:
    """Calculate recency bonus for an article based on publish time.

    Args:
        published_at: ISO format timestamp of when the article was published.

    Returns:
        Bonus points: 50 (< 1hr), 30 (< 3hr), 15 (< 6hr), 5 (< 12hr), 0 otherwise.
    """
    if not published_at:
        return 0.0

    try:
        # Handle various timestamp formats
        pub_time = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        if pub_time.tzinfo is None:
            pub_time = pub_time.replace(tzinfo=timezone.utc)
    except (ValueError, AttributeError):
        return 0.0

    now = datetime.now(timezone.utc)
    age = now - pub_time

    if age < timedelta(hours=1):
        return 50.0
    elif age < timedelta(hours=3):
        return 30.0
    elif age < timedelta(hours=6):
        return 15.0
    elif age < timedelta(hours=12):
        return 5.0
    return 0.0


def calculate_power_levels() -> list[dict]:
    """Calculate and update power levels for all topics.

    Queries the article_topics junction table, computes power level for each
    topic based on article count, social signals, and recency, then updates
    the topics table.

    Returns:
        List of topic dicts with updated power levels.
    """
    client = _get_client()

    # Get all topics
    topics_result = client.table("topics").select("id, name, slug").execute()
    topics = topics_result.data
    if not topics:
        print("No topics found in database.")
        return []

    print(f"Calculating power levels for {len(topics)} topics...")
    updated_topics = []

    for topic in topics:
        topic_id = topic["id"]

        # Get articles linked to this topic via junction table
        junction_result = client.table("article_topics").select(
            "article_id, relevance_score, articles(published_at, social_score)"
        ).eq("topic_id", topic_id).execute()

        linked = junction_result.data
        article_count = len(linked)

        if article_count == 0:
            # No articles, set power level to 0
            client.table("topics").update({
                "power_level": 0,
            }).eq("id", topic_id).execute()
            continue

        # Calculate components
        social_scores = []
        total_recency_bonus = 0.0

        for link in linked:
            article_data = link.get("articles", {})
            if not article_data:
                continue

            # Social score
            social = article_data.get("social_score") or 0
            social_scores.append(social)

            # Recency bonus
            published_at = article_data.get("published_at")
            total_recency_bonus += _recency_bonus(published_at)

        avg_social = sum(social_scores) / len(social_scores) if social_scores else 0.0

        # Power level formula
        power_level = (article_count * 10) + (avg_social * 5) + total_recency_bonus
        power_level = round(power_level, 2)

        # Update topic in database
        client.table("topics").update({
            "power_level": power_level,
        }).eq("id", topic_id).execute()

        topic_result = {
            "id": topic_id,
            "name": topic["name"],
            "slug": topic["slug"],
            "power_level": power_level,
            "article_count": article_count,
            "avg_social_score": round(avg_social, 2),
            "recency_bonus": round(total_recency_bonus, 2),
        }
        updated_topics.append(topic_result)
        print(f"  [{power_level:>8.1f}] {topic['name']} ({article_count} articles)")

    # Sort by power level descending
    updated_topics.sort(key=lambda t: t["power_level"], reverse=True)
    print(f"\nUpdated {len(updated_topics)} topics.")
    return updated_topics


def get_trending(limit: int = 20) -> list[dict]:
    """Get top trending topics ordered by power level.

    Args:
        limit: Maximum number of topics to return.

    Returns:
        List of topic dicts sorted by power_level descending.
    """
    client = _get_client()
    result = client.table("topics").select("*").order(
        "power_level", desc=True
    ).limit(limit).execute()
    return result.data


def main():
    parser = argparse.ArgumentParser(description="Calculate and display trending topics")
    parser.add_argument("--update", action="store_true", help="Recalculate power levels for all topics")
    parser.add_argument("--limit", type=int, default=20, help="Number of trending topics to display")
    args = parser.parse_args()

    if args.update:
        calculate_power_levels()
    else:
        topics = get_trending(limit=args.limit)
        if not topics:
            print("No trending topics found. Run with --update first.")
            return
        print(f"Top {len(topics)} trending topics:\n")
        for i, topic in enumerate(topics, 1):
            power = topic.get("power_level", 0)
            name = topic.get("name", "Unknown")
            print(f"  {i:>2}. [{power:>8.1f}] {name}")


if __name__ == "__main__":
    main()
