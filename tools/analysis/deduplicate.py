"""Deduplicate articles using TF-IDF cosine similarity.

Usage:
    python tools/analysis/deduplicate.py [--threshold 0.8] [--batch-size 100]

Compares new articles against existing ones and marks near-duplicates.
"""

import argparse
import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

load_dotenv()

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))


def compute_similarity_matrix(texts: list[str]) -> list[list[float]]:
    """Compute pairwise cosine similarity using TF-IDF."""
    if not texts:
        return []
    vectorizer = TfidfVectorizer(
        stop_words="english",
        max_features=10000,
        ngram_range=(1, 2),
    )
    tfidf_matrix = vectorizer.fit_transform(texts)
    return cosine_similarity(tfidf_matrix)


def find_duplicates(articles: list[dict], threshold: float = 0.8) -> list[tuple[int, int, float]]:
    """Find duplicate pairs in a list of articles.

    Returns list of (idx1, idx2, similarity_score) where similarity > threshold.
    """
    texts = []
    for a in articles:
        text = f"{a.get('title', '')} {a.get('summary', '') or a.get('content', '')}"
        texts.append(text)

    if len(texts) < 2:
        return []

    sim_matrix = compute_similarity_matrix(texts)
    duplicates = []

    for i in range(len(texts)):
        for j in range(i + 1, len(texts)):
            if sim_matrix[i][j] >= threshold:
                duplicates.append((i, j, float(sim_matrix[i][j])))

    return duplicates


def deduplicate_batch(articles: list[dict], threshold: float = 0.8) -> tuple[list[dict], list[dict]]:
    """Split articles into unique and duplicate sets.

    For duplicates, keeps the one from the most reliable source or earliest published.
    Returns (unique_articles, removed_duplicates).
    """
    if not articles:
        return [], []

    duplicates = find_duplicates(articles, threshold)

    # Build sets of duplicate indices — keep the "better" one
    remove_indices = set()
    for i, j, score in duplicates:
        a1 = articles[i]
        a2 = articles[j]

        # Prefer article with more content
        len1 = len(a1.get("content", "") or "")
        len2 = len(a2.get("content", "") or "")

        # Prefer higher reliability source
        rel1 = a1.get("source_reliability") or 0
        rel2 = a2.get("source_reliability") or 0

        if rel1 > rel2:
            remove_indices.add(j)
        elif rel2 > rel1:
            remove_indices.add(i)
        elif len1 >= len2:
            remove_indices.add(j)
        else:
            remove_indices.add(i)

    unique = [a for idx, a in enumerate(articles) if idx not in remove_indices]
    removed = [a for idx, a in enumerate(articles) if idx in remove_indices]

    return unique, removed


def deduplicate_against_existing(new_articles: list[dict], existing_articles: list[dict],
                                  threshold: float = 0.8) -> list[dict]:
    """Filter new articles that are too similar to existing ones.

    Returns only truly new articles.
    """
    if not existing_articles or not new_articles:
        return new_articles

    all_texts = []
    for a in existing_articles:
        text = f"{a.get('title', '')} {a.get('summary', '') or a.get('content', '')}"
        all_texts.append(text)
    for a in new_articles:
        text = f"{a.get('title', '')} {a.get('summary', '') or a.get('content', '')}"
        all_texts.append(text)

    vectorizer = TfidfVectorizer(stop_words="english", max_features=10000, ngram_range=(1, 2))
    tfidf_matrix = vectorizer.fit_transform(all_texts)

    n_existing = len(existing_articles)
    existing_vectors = tfidf_matrix[:n_existing]
    new_vectors = tfidf_matrix[n_existing:]

    sim = cosine_similarity(new_vectors, existing_vectors)

    truly_new = []
    for i, article in enumerate(new_articles):
        max_sim = sim[i].max() if sim[i].size > 0 else 0
        if max_sim < threshold:
            truly_new.append(article)

    return truly_new


def main():
    parser = argparse.ArgumentParser(description="Deduplicate articles")
    parser.add_argument("--threshold", type=float, default=0.8, help="Similarity threshold (0-1)")
    parser.add_argument("--batch-size", type=int, default=100, help="Process in batches")
    args = parser.parse_args()

    from tools.db.query_articles import get_client, get_latest_articles

    client = get_client()
    articles = get_latest_articles(client, limit=args.batch_size)

    print(f"Checking {len(articles)} articles for duplicates (threshold={args.threshold})...")
    unique, removed = deduplicate_batch(articles, threshold=args.threshold)
    print(f"Unique: {len(unique)}, Duplicates found: {len(removed)}")

    if removed:
        print("\nDuplicate articles:")
        for a in removed:
            print(f"  - {a['title'][:80]}...")


if __name__ == "__main__":
    main()
