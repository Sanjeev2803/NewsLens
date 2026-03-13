"""Multi-level news verification pipeline.

Usage:
    python tools/analysis/verify_news.py [--article-id ID] [--batch]

Verification Levels:
  0 = Unverified
  1 = Single source, credible outlet
  2 = Cross-source confirmed (2+ sources)
  3 = Fact-check API verified
  4 = Full verification (cross-source + fact-check + high credibility)
"""

import argparse
import os
import sys
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

GOOGLE_FACT_CHECK_KEY = os.getenv("GOOGLE_FACT_CHECK_API_KEY")
CLAIMBUSTER_KEY = os.getenv("CLAIMBUSTER_API_KEY")

# Source credibility tiers
HIGH_CREDIBILITY_SOURCES = {
    "Reuters", "AP News", "BBC World", "BBC Technology", "NPR News",
    "The Guardian - World", "Al Jazeera",
}

MEDIUM_CREDIBILITY_SOURCES = {
    "Ars Technica", "TechCrunch", "Google News - Top", "Google News - World",
    "Google News - Technology", "Google News - Science",
}


def check_source_credibility(source_name: str, reliability_score: float | None) -> int:
    """Level 1: Source credibility check. Returns 0 or 1."""
    if source_name in HIGH_CREDIBILITY_SOURCES:
        return 1
    if reliability_score and reliability_score >= 0.8:
        return 1
    if source_name in MEDIUM_CREDIBILITY_SOURCES:
        return 1
    return 0


def check_cross_source(client, article: dict, threshold: float = 0.6) -> tuple[int, list]:
    """Level 2: Cross-source confirmation.

    Searches for similar articles from different sources.
    Returns (confirmation_count, list of confirming articles).
    """
    from tools.analysis.deduplicate import compute_similarity_matrix

    title = article.get("title", "")
    source_id = article.get("source_id")

    # Search for articles with similar titles from other sources
    search_words = " ".join(title.split()[:6])  # First 6 words
    try:
        results = client.table("articles").select(
            "id, title, source_id, url, sources(name)"
        ).text_search("search_vector", search_words).neq(
            "source_id", source_id
        ).limit(20).execute()
    except Exception:
        # Fallback: search by title similarity
        results = client.table("articles").select(
            "id, title, source_id, url, sources(name)"
        ).neq("source_id", source_id).limit(50).execute()

    if not results.data:
        return 0, []

    # Compare titles for similarity
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity

    texts = [title] + [r["title"] for r in results.data]
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    tfidf = vectorizer.fit_transform(texts)
    sims = cosine_similarity(tfidf[0:1], tfidf[1:]).flatten()

    confirming = []
    for idx, sim_score in enumerate(sims):
        if sim_score >= threshold:
            confirming.append({
                "article_id": results.data[idx]["id"],
                "source_name": results.data[idx].get("sources", {}).get("name", "Unknown"),
                "similarity": float(sim_score),
                "url": results.data[idx]["url"],
            })

    return len(confirming), confirming


def check_google_fact_check(query: str) -> list[dict]:
    """Level 3: Query Google Fact Check Tools API."""
    if not GOOGLE_FACT_CHECK_KEY:
        return []

    try:
        resp = httpx.get(
            "https://factchecktools.googleapis.com/v1alpha1/claims:search",
            params={"query": query, "key": GOOGLE_FACT_CHECK_KEY, "languageCode": "en"},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"  Google Fact Check error: {e}")
        return []

    results = []
    for claim in data.get("claims", []):
        for review in claim.get("claimReview", []):
            results.append({
                "claim": claim.get("text", ""),
                "claimant": claim.get("claimant"),
                "verdict": review.get("textualRating", "Unknown"),
                "publisher": review.get("publisher", {}).get("name"),
                "url": review.get("url"),
            })

    return results


def check_claimbuster(text: str) -> float:
    """Check claim-worthiness score via ClaimBuster API.

    Returns score 0-1 where higher = more check-worthy.
    """
    if not CLAIMBUSTER_KEY:
        return 0.0

    try:
        resp = httpx.get(
            "https://idir.uta.edu/claimbuster/api/v2/score/text/",
            params={"input_text": text[:500]},
            headers={"x-api-key": CLAIMBUSTER_KEY},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results", [])
        if results:
            return max(r.get("score", 0) for r in results)
    except Exception as e:
        print(f"  ClaimBuster error: {e}")

    return 0.0


def verify_article(client, article: dict) -> dict:
    """Run full verification pipeline on an article.

    Returns verification result with level and details.
    """
    article_id = article["id"]
    title = article.get("title", "")
    source_name = ""
    reliability = None

    # Get source info
    if article.get("source_id"):
        source_result = client.table("sources").select(
            "name, reliability_score"
        ).eq("id", article["source_id"]).single().execute()
        if source_result.data:
            source_name = source_result.data["name"]
            reliability = source_result.data.get("reliability_score")

    verification = {
        "article_id": article_id,
        "level": 0,
        "source_credible": False,
        "cross_source_count": 0,
        "fact_checks": [],
        "claim_worthiness": 0.0,
    }

    # Level 1: Source credibility
    if check_source_credibility(source_name, reliability):
        verification["source_credible"] = True
        verification["level"] = 1
        print(f"  L1: Source '{source_name}' is credible")

    # Level 2: Cross-source confirmation
    count, confirming = check_cross_source(client, article)
    verification["cross_source_count"] = count
    if count >= 2:
        verification["level"] = max(verification["level"], 2)
        print(f"  L2: {count} cross-source confirmations")

        # Store confirmations in DB
        for conf in confirming:
            try:
                client.table("source_confirmations").insert({
                    "article_id": article_id,
                    "confirming_url": conf["url"],
                    "similarity_score": conf["similarity"],
                }).execute()
            except Exception:
                pass  # Skip if already exists

    # Level 3: Fact-check APIs
    fact_checks = check_google_fact_check(title)
    verification["fact_checks"] = fact_checks
    if fact_checks:
        verification["level"] = max(verification["level"], 3)
        print(f"  L3: {len(fact_checks)} fact-check results found")

        for fc in fact_checks:
            try:
                client.table("fact_checks").insert({
                    "article_id": article_id,
                    "claim_text": fc["claim"][:500],
                    "verdict": _normalize_verdict(fc["verdict"]),
                    "source_url": fc.get("url"),
                }).execute()
            except Exception:
                pass

    # Level 4: Full verification
    if (verification["source_credible"] and
            verification["cross_source_count"] >= 3 and
            (fact_checks or check_claimbuster(title) < 0.5)):
        verification["level"] = 4
        print(f"  L4: Fully verified")

    # Update article verification level
    client.table("articles").update({
        "verification_level": verification["level"],
        "source_count": max(1, count + 1),
    }).eq("id", article_id).execute()

    return verification


def _normalize_verdict(verdict_text: str) -> str:
    """Normalize fact-check verdicts to our schema values."""
    v = verdict_text.lower()
    if any(w in v for w in ["true", "correct", "accurate"]):
        if any(w in v for w in ["mostly", "partly"]):
            return "mostly_true"
        return "true"
    if any(w in v for w in ["false", "incorrect", "wrong", "pants on fire"]):
        if any(w in v for w in ["mostly", "partly"]):
            return "mostly_false"
        return "false"
    if any(w in v for w in ["mixed", "half"]):
        return "mixed"
    return "unverified"


def main():
    parser = argparse.ArgumentParser(description="Verify news articles")
    parser.add_argument("--article-id", type=str, help="Verify specific article")
    parser.add_argument("--batch", action="store_true", help="Verify all unverified articles")
    parser.add_argument("--limit", type=int, default=50, help="Batch limit")
    args = parser.parse_args()

    from tools.db.query_articles import get_client, get_unverified_articles, get_article_by_id

    client = get_client()

    if args.article_id:
        article = get_article_by_id(client, args.article_id)
        if not article:
            print(f"Article {args.article_id} not found")
            sys.exit(1)
        result = verify_article(client, article)
        print(f"\nVerification result: Level {result['level']}")
    elif args.batch:
        articles = get_unverified_articles(client, limit=args.limit)
        print(f"Verifying {len(articles)} unverified articles...")
        for article in articles:
            print(f"\n[{article['title'][:60]}...]")
            verify_article(client, article)
    else:
        print("Specify --article-id or --batch")


if __name__ == "__main__":
    main()
