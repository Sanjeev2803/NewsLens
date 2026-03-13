"""Scrape news articles from RSS feeds (Google News + major outlets).

Usage:
    python tools/scrapers/scrape_rss.py [--store] [--limit N]

Feeds are free and unlimited. Primary news source for NewsLens.
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from time import mktime

import feedparser
import httpx
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

# Add project root to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

RSS_FEEDS = {
    # Google News
    "Google News - Top": "https://news.google.com/rss",
    "Google News - World": "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB",
    "Google News - US": "https://news.google.com/rss/topics/CAAqIggKIhxDQkFTRHdvSkwyMHZNRGxqTjNjd0VnSmxiaWdBUAE",
    "Google News - Technology": "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB",
    "Google News - Science": "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVAB",
    "Google News - Business": "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB",
    # Major outlets
    "Reuters": "https://feeds.reuters.com/reuters/topNews",
    "AP News": "https://rsshub.app/apnews/topics/apf-topnews",
    "BBC World": "http://feeds.bbci.co.uk/news/world/rss.xml",
    "BBC Technology": "http://feeds.bbci.co.uk/news/technology/rss.xml",
    "NPR News": "https://feeds.npr.org/1001/rss.xml",
    "Al Jazeera": "https://www.aljazeera.com/xml/rss/all.xml",
    "The Guardian - World": "https://www.theguardian.com/world/rss",
    "Ars Technica": "https://feeds.arstechnica.com/arstechnica/index",
    "TechCrunch": "https://techcrunch.com/feed/",
}

# Source bias ratings (from Media Bias/Fact Check)
SOURCE_BIAS = {
    "Reuters": ("center", 0.95),
    "AP News": ("center", 0.95),
    "BBC World": ("center_left", 0.90),
    "BBC Technology": ("center_left", 0.90),
    "NPR News": ("center_left", 0.85),
    "Al Jazeera": ("center_left", 0.80),
    "The Guardian - World": ("left", 0.85),
    "Ars Technica": ("center_left", 0.85),
    "TechCrunch": ("center", 0.80),
}


def parse_published_date(entry) -> str | None:
    """Extract and normalize published date from feed entry."""
    if hasattr(entry, "published_parsed") and entry.published_parsed:
        dt = datetime.fromtimestamp(mktime(entry.published_parsed), tz=timezone.utc)
        return dt.isoformat()
    if hasattr(entry, "updated_parsed") and entry.updated_parsed:
        dt = datetime.fromtimestamp(mktime(entry.updated_parsed), tz=timezone.utc)
        return dt.isoformat()
    return None


def extract_image(entry) -> str | None:
    """Try to extract image URL from feed entry."""
    # Check media:content
    if hasattr(entry, "media_content") and entry.media_content:
        for media in entry.media_content:
            if media.get("medium") == "image" or media.get("url", "").endswith((".jpg", ".png", ".webp")):
                return media["url"]
    # Check media:thumbnail
    if hasattr(entry, "media_thumbnail") and entry.media_thumbnail:
        return entry.media_thumbnail[0].get("url")
    # Check enclosures
    if hasattr(entry, "enclosures") and entry.enclosures:
        for enc in entry.enclosures:
            if enc.get("type", "").startswith("image/"):
                return enc["href"]
    # Parse from description/summary HTML
    desc = getattr(entry, "description", "") or getattr(entry, "summary", "")
    if desc:
        soup = BeautifulSoup(desc, "html.parser")
        img = soup.find("img")
        if img and img.get("src"):
            return img["src"]
    return None


def clean_html(text: str) -> str:
    """Remove HTML tags from text."""
    if not text:
        return ""
    soup = BeautifulSoup(text, "html.parser")
    return soup.get_text(separator=" ", strip=True)


def scrape_feed(feed_name: str, feed_url: str, limit: int = 50) -> list[dict]:
    """Scrape a single RSS feed and return parsed articles."""
    try:
        feed = feedparser.parse(feed_url)
    except Exception as e:
        print(f"Error parsing {feed_name}: {e}")
        return []

    if feed.bozo and not feed.entries:
        print(f"Warning: Feed {feed_name} has errors: {feed.bozo_exception}")
        return []

    articles = []
    bias_info = SOURCE_BIAS.get(feed_name, (None, None))

    for entry in feed.entries[:limit]:
        title = clean_html(getattr(entry, "title", ""))
        if not title:
            continue

        url = getattr(entry, "link", "")
        if not url:
            continue

        description = clean_html(getattr(entry, "description", "") or getattr(entry, "summary", ""))
        author = getattr(entry, "author", None)
        image_url = extract_image(entry)
        published_at = parse_published_date(entry)

        articles.append({
            "title": title,
            "url": url,
            "content": description,  # RSS usually only has summary
            "summary": description[:500] if description else None,
            "image_url": image_url,
            "author": author,
            "published_at": published_at,
            "source_name": feed_name,
            "source_type": "rss",
            "source_bias": bias_info[0],
            "source_reliability": bias_info[1],
            "metadata": {
                "feed_url": feed_url,
                "scraped_at": datetime.now(timezone.utc).isoformat(),
            },
        })

    print(f"  [{feed_name}] Scraped {len(articles)} articles")
    return articles


def scrape_all_feeds(limit_per_feed: int = 50) -> list[dict]:
    """Scrape all configured RSS feeds."""
    all_articles = []
    for name, url in RSS_FEEDS.items():
        articles = scrape_feed(name, url, limit=limit_per_feed)
        all_articles.extend(articles)
    return all_articles


def main():
    parser = argparse.ArgumentParser(description="Scrape RSS feeds for news articles")
    parser.add_argument("--store", action="store_true", help="Store articles in Supabase")
    parser.add_argument("--limit", type=int, default=50, help="Max articles per feed")
    parser.add_argument("--feed", type=str, help="Scrape only this feed name")
    args = parser.parse_args()

    print(f"Scraping RSS feeds (limit={args.limit} per feed)...")
    if args.feed:
        if args.feed not in RSS_FEEDS:
            print(f"Unknown feed: {args.feed}")
            print(f"Available: {', '.join(RSS_FEEDS.keys())}")
            sys.exit(1)
        articles = scrape_feed(args.feed, RSS_FEEDS[args.feed], limit=args.limit)
    else:
        articles = scrape_all_feeds(limit_per_feed=args.limit)

    print(f"\nTotal: {len(articles)} articles scraped")

    if args.store:
        from tools.db.store_articles import get_client, ensure_source, store_articles_batch, update_source_fetched

        client = get_client()
        # Group by source for batch insert
        by_source = {}
        for a in articles:
            by_source.setdefault(a["source_name"], []).append(a)

        total_stored = 0
        total_skipped = 0
        for source_name, source_articles in by_source.items():
            source_id = ensure_source(
                client, source_name, "rss",
                url=RSS_FEEDS.get(source_name),
                bias_rating=source_articles[0].get("source_bias"),
                reliability_score=source_articles[0].get("source_reliability"),
            )
            for a in source_articles:
                a["source_id"] = source_id
            result = store_articles_batch(client, source_articles)
            total_stored += result["stored"]
            total_skipped += result["skipped"]
            update_source_fetched(client, source_id)

        print(f"Stored: {total_stored}, Skipped (duplicates): {total_skipped}")
    else:
        # Output to .tmp
        output_path = os.path.join(os.path.dirname(__file__), "..", "..", ".tmp", "rss_articles.json")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(articles, f, indent=2, ensure_ascii=False)
        print(f"Saved to {output_path}")


if __name__ == "__main__":
    main()
