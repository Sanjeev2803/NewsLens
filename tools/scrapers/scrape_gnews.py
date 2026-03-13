"""Scrape news from GNews.io API.

Usage:
    python tools/scrapers/scrape_gnews.py [--store] [--limit N] [--topic TOPIC] [--query QUERY]

Free tier: 100 requests/day. Use sparingly — supplement RSS for search/topic queries.
Topics: general, world, nation, business, technology, entertainment, sports, science, health
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

GNEWS_API_KEY = os.getenv("GNEWS_API_KEY")
BASE_URL = "https://gnews.io/api/v4"

TOPICS = ["general", "world", "nation", "business", "technology", "entertainment", "sports", "science", "health"]


def scrape_top_headlines(topic: str = "general", limit: int = 10, lang: str = "en", country: str = "us") -> list[dict]:
    """Fetch top headlines for a topic."""
    if not GNEWS_API_KEY:
        print("Error: GNEWS_API_KEY must be set in .env")
        sys.exit(1)

    params = {
        "token": GNEWS_API_KEY,
        "topic": topic,
        "lang": lang,
        "country": country,
        "max": min(limit, 10),  # Free tier max 10 per request
    }

    try:
        resp = httpx.get(f"{BASE_URL}/top-headlines", params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 403:
            print("Error: GNews API key invalid or quota exceeded")
        else:
            print(f"Error: HTTP {e.response.status_code}")
        return []
    except Exception as e:
        print(f"Error fetching GNews: {e}")
        return []

    articles = []
    for item in data.get("articles", []):
        articles.append({
            "title": item["title"],
            "url": item["url"],
            "content": item.get("content"),
            "summary": item.get("description"),
            "image_url": item.get("image"),
            "author": None,
            "published_at": item.get("publishedAt"),
            "source_name": item.get("source", {}).get("name", "GNews"),
            "source_type": "gnews",
            "metadata": {
                "gnews_topic": topic,
                "gnews_source_url": item.get("source", {}).get("url"),
                "scraped_at": datetime.now(timezone.utc).isoformat(),
            },
        })

    print(f"  [GNews/{topic}] Fetched {len(articles)} articles")
    return articles


def search_news(query: str, limit: int = 10, lang: str = "en") -> list[dict]:
    """Search GNews for specific query."""
    if not GNEWS_API_KEY:
        print("Error: GNEWS_API_KEY must be set in .env")
        sys.exit(1)

    params = {
        "token": GNEWS_API_KEY,
        "q": query,
        "lang": lang,
        "max": min(limit, 10),
    }

    try:
        resp = httpx.get(f"{BASE_URL}/search", params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"Error searching GNews: {e}")
        return []

    articles = []
    for item in data.get("articles", []):
        articles.append({
            "title": item["title"],
            "url": item["url"],
            "content": item.get("content"),
            "summary": item.get("description"),
            "image_url": item.get("image"),
            "published_at": item.get("publishedAt"),
            "source_name": item.get("source", {}).get("name", "GNews"),
            "source_type": "gnews",
            "metadata": {
                "gnews_query": query,
                "scraped_at": datetime.now(timezone.utc).isoformat(),
            },
        })

    print(f"  [GNews/search:{query}] Fetched {len(articles)} articles")
    return articles


def main():
    parser = argparse.ArgumentParser(description="Scrape GNews.io API")
    parser.add_argument("--store", action="store_true", help="Store in Supabase")
    parser.add_argument("--limit", type=int, default=10, help="Max articles per request")
    parser.add_argument("--topic", type=str, default="general", choices=TOPICS)
    parser.add_argument("--query", type=str, help="Search query instead of topic")
    args = parser.parse_args()

    print("Scraping GNews.io...")
    if args.query:
        articles = search_news(args.query, limit=args.limit)
    else:
        articles = scrape_top_headlines(args.topic, limit=args.limit)

    print(f"\nTotal: {len(articles)} articles")

    if args.store:
        from tools.db.store_articles import get_client, ensure_source, store_articles_batch

        client = get_client()
        by_source = {}
        for a in articles:
            by_source.setdefault(a["source_name"], []).append(a)

        total_stored = 0
        for source_name, source_articles in by_source.items():
            source_id = ensure_source(client, source_name, "gnews")
            for a in source_articles:
                a["source_id"] = source_id
            result = store_articles_batch(client, source_articles)
            total_stored += result["stored"]

        print(f"Stored: {total_stored}")
    else:
        output_path = os.path.join(os.path.dirname(__file__), "..", "..", ".tmp", "gnews_articles.json")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(articles, f, indent=2, ensure_ascii=False)
        print(f"Saved to {output_path}")


if __name__ == "__main__":
    main()
