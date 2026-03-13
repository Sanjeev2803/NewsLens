"""Scrape trending news from Reddit using PRAW.

Usage:
    python tools/scrapers/scrape_reddit.py [--store] [--limit N] [--subreddit NAME]

Free tier: 100 requests/minute. Best for social signal and trending topics.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

NEWS_SUBREDDITS = [
    "worldnews",
    "news",
    "technology",
    "science",
    "business",
    "politics",
    "upliftingnews",
    "futurology",
]


def get_reddit_client():
    """Create authenticated Reddit client."""
    import praw

    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")
    user_agent = os.getenv("REDDIT_USER_AGENT", "NewsLens/1.0")

    if not client_id or not client_secret:
        print("Error: REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET must be set in .env")
        sys.exit(1)

    return praw.Reddit(
        client_id=client_id,
        client_secret=client_secret,
        user_agent=user_agent,
    )


def scrape_subreddit(reddit, subreddit_name: str, sort: str = "hot", limit: int = 25) -> list[dict]:
    """Scrape posts from a subreddit."""
    articles = []
    try:
        subreddit = reddit.subreddit(subreddit_name)
        if sort == "hot":
            posts = subreddit.hot(limit=limit)
        elif sort == "top":
            posts = subreddit.top(time_filter="day", limit=limit)
        elif sort == "new":
            posts = subreddit.new(limit=limit)
        else:
            posts = subreddit.hot(limit=limit)

        for post in posts:
            # Skip self-posts without links, stickied posts
            if post.stickied:
                continue

            # External link posts are news articles
            is_link = not post.is_self and post.url and not post.url.startswith("https://www.reddit.com")

            articles.append({
                "title": post.title,
                "url": post.url if is_link else f"https://www.reddit.com{post.permalink}",
                "content": post.selftext if post.is_self else None,
                "summary": post.title,
                "image_url": post.thumbnail if post.thumbnail and post.thumbnail.startswith("http") else None,
                "author": str(post.author) if post.author else None,
                "published_at": datetime.fromtimestamp(post.created_utc, tz=timezone.utc).isoformat(),
                "source_name": f"r/{subreddit_name}",
                "source_type": "reddit",
                "metadata": {
                    "reddit_score": post.score,
                    "reddit_upvote_ratio": post.upvote_ratio,
                    "reddit_num_comments": post.num_comments,
                    "reddit_permalink": post.permalink,
                    "is_link_post": is_link,
                    "original_source_domain": post.domain if is_link else None,
                    "subreddit": subreddit_name,
                    "scraped_at": datetime.now(timezone.utc).isoformat(),
                },
            })

        print(f"  [r/{subreddit_name}] Scraped {len(articles)} posts")
    except Exception as e:
        print(f"  Error scraping r/{subreddit_name}: {e}")

    return articles


def scrape_all_subreddits(reddit, limit_per_sub: int = 25) -> list[dict]:
    """Scrape all configured subreddits."""
    all_articles = []
    for sub in NEWS_SUBREDDITS:
        articles = scrape_subreddit(reddit, sub, limit=limit_per_sub)
        all_articles.extend(articles)
    return all_articles


def main():
    parser = argparse.ArgumentParser(description="Scrape Reddit for news")
    parser.add_argument("--store", action="store_true", help="Store in Supabase")
    parser.add_argument("--limit", type=int, default=25, help="Max posts per subreddit")
    parser.add_argument("--subreddit", type=str, help="Scrape only this subreddit")
    args = parser.parse_args()

    reddit = get_reddit_client()
    print(f"Scraping Reddit (limit={args.limit} per sub)...")

    if args.subreddit:
        articles = scrape_subreddit(reddit, args.subreddit, limit=args.limit)
    else:
        articles = scrape_all_subreddits(reddit, limit_per_sub=args.limit)

    print(f"\nTotal: {len(articles)} posts scraped")

    if args.store:
        from tools.db.store_articles import get_client, ensure_source, store_articles_batch, update_source_fetched

        client = get_client()
        by_source = {}
        for a in articles:
            by_source.setdefault(a["source_name"], []).append(a)

        total_stored = 0
        total_skipped = 0
        for source_name, source_articles in by_source.items():
            source_id = ensure_source(client, source_name, "reddit")
            for a in source_articles:
                a["source_id"] = source_id
            result = store_articles_batch(client, source_articles)
            total_stored += result["stored"]
            total_skipped += result["skipped"]
            update_source_fetched(client, source_id)

        print(f"Stored: {total_stored}, Skipped (duplicates): {total_skipped}")
    else:
        output_path = os.path.join(os.path.dirname(__file__), "..", "..", ".tmp", "reddit_articles.json")
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(articles, f, indent=2, ensure_ascii=False)
        print(f"Saved to {output_path}")


if __name__ == "__main__":
    main()
