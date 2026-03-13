"""Sentiment analysis for news articles using VADER.

Usage:
    python tools/ai/sentiment.py [--batch] [--limit 50] [--text "some text"]

Uses VADER (Valence Aware Dictionary and sEntiment Reasoner) for fast,
lexicon-based sentiment scoring of article titles and descriptions.
"""

import argparse
import json
import os
import sys

from dotenv import load_dotenv
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

_analyzer = SentimentIntensityAnalyzer()


def analyze_sentiment(text: str) -> dict:
    """Analyze sentiment of a text string using VADER.

    Args:
        text: The text to analyze (typically title + description).

    Returns:
        dict with sentiment_score (-1 to 1), sentiment_label, and confidence.
    """
    if not text or not text.strip():
        return {
            "sentiment_score": 0.0,
            "sentiment_label": "neutral",
            "confidence": 0.0,
        }

    scores = _analyzer.polarity_scores(text)
    compound = scores["compound"]

    # Determine label from compound score
    if compound >= 0.05:
        label = "positive"
    elif compound <= -0.05:
        label = "negative"
    else:
        label = "neutral"

    # Confidence is derived from how far the compound score is from zero
    # and from the distribution of pos/neg/neu scores
    confidence = round(abs(compound), 3)

    return {
        "sentiment_score": round(compound, 4),
        "sentiment_label": label,
        "confidence": confidence,
    }


def batch_analyze(limit: int = 50) -> dict:
    """Process unanalyzed articles from Supabase and update sentiment columns.

    Args:
        limit: Maximum number of articles to process.

    Returns:
        dict with counts of processed and failed articles.
    """
    from tools.db.query_articles import get_client, get_unanalyzed_articles

    client = get_client()
    articles = get_unanalyzed_articles(client, limit=limit)

    if not articles:
        print("No unanalyzed articles found.")
        return {"processed": 0, "failed": 0}

    print(f"Analyzing sentiment for {len(articles)} articles...")
    processed = 0
    failed = 0

    for article in articles:
        article_id = article["id"]
        # Combine title and content/description for richer analysis
        text_parts = [article.get("title", "")]
        if article.get("content"):
            text_parts.append(article["content"][:1000])
        text = ". ".join(p for p in text_parts if p)

        try:
            result = analyze_sentiment(text)
            client.table("articles").update({
                "sentiment_score": result["sentiment_score"],
                "sentiment_label": result["sentiment_label"],
            }).eq("id", article_id).execute()
            processed += 1
            print(f"  [{result['sentiment_label']:>8}] ({result['sentiment_score']:+.3f}) {article['title'][:70]}")
        except Exception as e:
            print(f"  [ERROR] {article['title'][:50]}: {e}")
            failed += 1

    print(f"\nDone: {processed} processed, {failed} failed")
    return {"processed": processed, "failed": failed}


def main():
    parser = argparse.ArgumentParser(description="Analyze sentiment of news articles using VADER")
    parser.add_argument("--batch", action="store_true", help="Process unanalyzed articles from Supabase")
    parser.add_argument("--limit", type=int, default=50, help="Max articles to process in batch mode")
    parser.add_argument("--text", type=str, help="Analyze sentiment of a specific text string")
    args = parser.parse_args()

    if args.text:
        result = analyze_sentiment(args.text)
        print(json.dumps(result, indent=2))
    elif args.batch:
        batch_analyze(limit=args.limit)
    else:
        print("Specify --text 'some text' or --batch")
        print("Example: python tools/ai/sentiment.py --text 'The economy is booming'")


if __name__ == "__main__":
    main()
