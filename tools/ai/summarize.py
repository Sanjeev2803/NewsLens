"""Summarize news articles using Anthropic Claude API.

Usage:
    python tools/ai/summarize.py [--batch] [--limit 20] [--article-id ID]

Generates concise 2-3 sentence summaries of news articles and stores
them in the ai_summary column of the articles table.
"""

import argparse
import json
import os
import sys
import time

import anthropic
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

# Rate limiting: pause between API calls to avoid hitting limits
API_DELAY_SECONDS = 1.5

SUMMARY_SYSTEM_PROMPT = (
    "You are a concise news summarizer. Given a news article's title, description, "
    "and any available content, produce a factual 2-3 sentence summary. "
    "Focus on the key facts: who, what, when, where, and why. "
    "Do not editorialize or add opinions. Write in plain, clear English."
)


def _get_anthropic_client() -> anthropic.Anthropic:
    """Create and return an Anthropic client."""
    if not ANTHROPIC_API_KEY:
        print("Error: ANTHROPIC_API_KEY must be set in .env")
        sys.exit(1)
    return anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


def summarize_article(title: str, content: str | None = None,
                      description: str | None = None) -> str:
    """Generate a 2-3 sentence summary of an article using Claude.

    Args:
        title: Article headline.
        content: Full article text (may be truncated RSS content).
        description: Short description or summary from the source.

    Returns:
        A concise summary string.
    """
    client = _get_anthropic_client()

    # Build the user message from available fields
    parts = [f"Title: {title}"]
    if description:
        parts.append(f"Description: {description[:1000]}")
    if content and content != description:
        parts.append(f"Content: {content[:3000]}")

    user_message = "\n\n".join(parts)
    user_message += "\n\nProvide a 2-3 sentence factual summary of this article."

    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            system=SUMMARY_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        return response.content[0].text.strip()
    except anthropic.RateLimitError:
        print("  Rate limited by Anthropic API, waiting 30s...")
        time.sleep(30)
        # Retry once
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            system=SUMMARY_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        return response.content[0].text.strip()


def batch_summarize(limit: int = 20) -> dict:
    """Process articles without AI summaries from Supabase.

    Args:
        limit: Maximum number of articles to process.

    Returns:
        dict with counts of processed and failed articles.
    """
    from tools.db.query_articles import get_client

    client = get_client()

    # Fetch articles missing ai_summary
    result = client.table("articles").select(
        "id, title, content, summary"
    ).is_("ai_summary", "null").order(
        "scraped_at", desc=True
    ).limit(limit).execute()

    articles = result.data
    if not articles:
        print("No articles need summarization.")
        return {"processed": 0, "failed": 0}

    print(f"Summarizing {len(articles)} articles...")
    processed = 0
    failed = 0

    for i, article in enumerate(articles):
        article_id = article["id"]
        title = article.get("title", "")
        content = article.get("content")
        description = article.get("summary")

        try:
            summary = summarize_article(title, content=content, description=description)
            client.table("articles").update({
                "ai_summary": summary,
            }).eq("id", article_id).execute()
            processed += 1
            print(f"  [{i+1}/{len(articles)}] {title[:60]}...")
            print(f"    -> {summary[:100]}...")
        except Exception as e:
            print(f"  [ERROR] {title[:50]}: {e}")
            failed += 1

        # Rate limit delay between API calls
        if i < len(articles) - 1:
            time.sleep(API_DELAY_SECONDS)

    print(f"\nDone: {processed} processed, {failed} failed")
    return {"processed": processed, "failed": failed}


def main():
    parser = argparse.ArgumentParser(description="Summarize news articles using Claude API")
    parser.add_argument("--batch", action="store_true", help="Summarize articles missing ai_summary")
    parser.add_argument("--limit", type=int, default=20, help="Max articles to process in batch mode")
    parser.add_argument("--article-id", type=str, help="Summarize a specific article by ID")
    args = parser.parse_args()

    if args.article_id:
        from tools.db.query_articles import get_client, get_article_by_id

        client = get_client()
        article = get_article_by_id(client, args.article_id)
        if not article:
            print(f"Article {args.article_id} not found")
            sys.exit(1)

        summary = summarize_article(
            article["title"],
            content=article.get("content"),
            description=article.get("summary"),
        )
        print(f"Title: {article['title']}")
        print(f"\nSummary: {summary}")

        # Update in DB
        client.table("articles").update({
            "ai_summary": summary,
        }).eq("id", args.article_id).execute()
        print("\nStored in database.")

    elif args.batch:
        batch_summarize(limit=args.limit)
    else:
        print("Specify --article-id ID or --batch")
        print("Example: python tools/ai/summarize.py --batch --limit 10")


if __name__ == "__main__":
    main()
