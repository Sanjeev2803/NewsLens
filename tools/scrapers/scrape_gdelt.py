"""Scrape global news events from GDELT Project.

Usage:
    python tools/scrapers/scrape_gdelt.py [--store] [--limit N] [--query QUERY]

Free and unlimited. Best for global events with geolocation data (for 3D globe).
Uses GDELT DOC 2.0 API.
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

GDELT_DOC_API = "https://api.gdeltproject.org/api/v2/doc/doc"


def scrape_gdelt(query: str = "", mode: str = "artlist", limit: int = 50,
                 timespan: str = "24h", sourcelang: str = "english") -> list[dict]:
    """Query GDELT DOC 2.0 API for articles.

    Args:
        query: Search query (empty = all recent news)
        mode: artlist (articles) or timelinevol (volume timeline)
        limit: Max results (GDELT caps at 250)
        timespan: Time window (e.g., "24h", "7d")
        sourcelang: Language filter
    """
    params = {
        "query": query or "sourcelang:english",
        "mode": mode,
        "maxrecords": min(limit, 250),
        "timespan": timespan,
        "format": "json",
        "sort": "datedesc",
    }
    if sourcelang:
        if query:
            params["query"] = f"{query} sourcelang:{sourcelang}"
        else:
            params["query"] = f"sourcelang:{sourcelang}"

    try:
        resp = httpx.get(GDELT_DOC_API, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"Error fetching GDELT: {e}")
        return []

    articles = []
    for item in data.get("articles", []):
        # Extract geolocation if available
        geo = {}
        if item.get("sourcecountry"):
            geo["country"] = item["sourcecountry"]
        if item.get("sourcelat") and item.get("sourcelong"):
            geo["lat"] = float(item["sourcelat"])
            geo["lng"] = float(item["sourcelong"])

        # Parse GDELT date format (YYYYMMDDHHMMSS)
        published_at = None
        if item.get("seendate"):
            try:
                dt = datetime.strptime(item["seendate"], "%Y%m%dT%H%M%SZ")
                published_at = dt.replace(tzinfo=timezone.utc).isoformat()
            except ValueError:
                pass

        articles.append({
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "content": None,  # GDELT doesn't provide content
            "summary": item.get("title"),
            "image_url": item.get("socialimage"),
            "author": None,
            "published_at": published_at,
            "source_name": item.get("domain", "GDELT"),
            "source_type": "gdelt",
            "metadata": {
                "gdelt_tone": item.get("tone"),
                "gdelt_language": item.get("language"),
                "gdelt_domain": item.get("domain"),
                "geolocation": geo if geo else None,
                "scraped_at": datetime.now(timezone.utc).isoformat(),
            },
        })

    print(f"  [GDELT] Fetched {len(articles)} articles")
    return articles


def scrape_gdelt_geo(limit: int = 100) -> list[dict]:
    """Scrape GDELT specifically for geolocated events (for 3D globe).

    Returns only articles that have geolocation data.
    """
    articles = scrape_gdelt(limit=limit)
    geo_articles = [a for a in articles if a["metadata"].get("geolocation")]
    print(f"  [GDELT/geo] {len(geo_articles)} geolocated articles out of {len(articles)}")
    return geo_articles


def main():
    parser = argparse.ArgumentParser(description="Scrape GDELT for global news events")
    parser.add_argument("--store", action="store_true", help="Store in Supabase")
    parser.add_argument("--limit", type=int, default=50, help="Max articles")
    parser.add_argument("--query", type=str, default="", help="Search query")
    parser.add_argument("--geo-only", action="store_true", help="Only geolocated articles")
    parser.add_argument("--timespan", type=str, default="24h", help="Time window")
    args = parser.parse_args()

    print(f"Scraping GDELT (limit={args.limit}, timespan={args.timespan})...")

    if args.geo_only:
        articles = scrape_gdelt_geo(limit=args.limit)
    else:
        articles = scrape_gdelt(query=args.query, limit=args.limit, timespan=args.timespan)

    print(f"\nTotal: {len(articles)} articles")

    if args.store:
        from tools.db.store_articles import get_client, ensure_source, store_articles_batch

        client = get_client()
        by_source = {}
        for a in articles:
            by_source.setdefault(a["source_name"], []).append(a)

        total_stored = 0
        for source_name, source_articles in by_source.items():
            source_id = ensure_source(client, source_name, "gdelt")
            for a in source_articles:
                a["source_id"] = source_id
            result = store_articles_batch(client, source_articles)
            total_stored += result["stored"]

        print(f"Stored: {total_stored}")
    else:
        output_path = os.path.join(os.path.dirname(__file__), "..", "..", ".tmp", "gdelt_articles.json")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(articles, f, indent=2, ensure_ascii=False)
        print(f"Saved to {output_path}")


if __name__ == "__main__":
    main()
