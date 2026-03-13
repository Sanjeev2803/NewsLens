# Workflow: Ingest News

## Objective
Scrape news from all configured sources, deduplicate, and store in Supabase.

## Schedule
Every 30 minutes via GitHub Actions (`scrape-cron.yml`)

## Steps

### 1. Scrape All Sources (parallel where possible)
Run each scraper — they output to `.tmp/` by default or directly to Supabase with `--store`:

```bash
# Primary source (free, unlimited)
python tools/scrapers/scrape_rss.py --store --limit 50

# Social signal (free, 100 req/min)
python tools/scrapers/scrape_reddit.py --store --limit 25

# Supplementary (100 req/day — use sparingly)
python tools/scrapers/scrape_gnews.py --store --topic general --limit 10

# Global events with geolocation (free, unlimited)
python tools/scrapers/scrape_gdelt.py --store --limit 50
```

### 2. Deduplicate
After ingestion, run deduplication on recent articles:
```bash
python tools/analysis/deduplicate.py --threshold 0.8 --batch-size 100
```

### 3. Verify
Run verification pipeline on new articles:
```bash
python tools/analysis/verify_news.py --batch --limit 50
```

## Rate Limit Notes
- **GNews**: 100 requests/day. Only call for specific topic queries, not bulk scraping.
- **Reddit**: 100 req/min. Safe to run every 30 min.
- **Google Fact Check API**: Generous free tier but don't abuse.
- **GDELT**: No limits, but responses can be slow — use 30s timeout.

## Error Handling
- If a scraper fails, log the error and continue with other sources
- If Supabase is down, save to `.tmp/` and retry on next run
- If rate limited, back off and skip that source this cycle

## Outputs
- Articles stored in `articles` table with source references
- Sources table updated with `last_fetched_at`
- Verification levels assigned (0-4)

## Learned Constraints
- Google News RSS occasionally returns 403 — retry once after 5s
- Reddit API requires User-Agent header — set in .env
- GDELT date format is `YYYYMMDDTHHMMSSZ` — parsed in scraper
