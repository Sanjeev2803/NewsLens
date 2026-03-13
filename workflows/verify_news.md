# Workflow: Verify News

## Objective
Run the multi-level verification pipeline on unverified articles to assign trust scores.

## Verification Levels

| Level | Name | Criteria |
|-------|------|----------|
| 0 | Unverified | Default state, no checks performed |
| 1 | Source Credible | From a known credible outlet (Reuters, AP, BBC, etc.) |
| 2 | Cross-Confirmed | 2+ independent sources report the same story (TF-IDF similarity ≥ 0.6) |
| 3 | Fact-Checked | Google Fact Check API has relevant fact-check results |
| 4 | Fully Verified | Cross-confirmed (3+) + credible source + fact-check clean |

## Steps

### 1. Get Unverified Articles
```bash
python tools/analysis/verify_news.py --batch --limit 50
```

### 2. Per-Article Pipeline
For each article, the tool runs:

1. **Source Credibility Check** — looks up source name against known credible outlets + reliability_score
2. **Cross-Source Confirmation** — searches for similar articles from different sources using TF-IDF on titles
3. **Google Fact Check API** — queries for existing fact-checks on the article's claims
4. **ClaimBuster** — scores claim-worthiness (high score = needs verification)
5. **Assign Level** — highest level achieved becomes the article's verification_level

### 3. Store Results
- `articles.verification_level` updated
- `articles.source_count` updated
- `fact_checks` table populated with API results
- `source_confirmations` table populated with cross-source matches

## Schedule
Runs after each ingestion cycle (every 30 min) or on-demand for specific articles.

## Edge Cases
- Articles with very short titles may not match well in cross-source — lower threshold to 0.5
- Fact-check API may return results for different claims about the same topic — display all, let user judge
- If both APIs are unavailable, max level is 2 (cross-source only)

## Display Rules
- Level 0-1: No badge shown
- Level 2: "Confirmed" badge (green)
- Level 3: "Fact-Checked" badge (blue)
- Level 4: "Verified" badge (gold shield)
- Show methodology on hover/click
