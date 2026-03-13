
# NewsLens — Project Master Plan

## Vision
NewsLens is an anime-powered news intelligence platform. Opening the app feels like entering the Hidden Leaf Village. News articles are scrolls that unravel, breaking news crashes in like a Rasengan, trending topics have power levels that visually charge up. Users don't just read — they interact, create, experiment, and rank up.

**Tagline:** "See Through The Noise"

---

## Architecture

### Backend
- **Database:** Supabase (PostgreSQL + RLS + Real-time)
- **API:** FastAPI + Socket.IO for real-time
- **AI:** VADER sentiment, spaCy NER, Claude API for summaries/what-ifs
- **Scheduler:** APScheduler for periodic ingestion

### Frontend
- **Framework:** Next.js 14 + App Router + TypeScript
- **Styling:** Tailwind CSS with custom Naruto-themed design system
- **Animation:** GSAP, Framer Motion, Theatre.js, Anime.js
- **3D:** React Three Fiber + drei + postprocessing
- **Real-time:** Socket.IO client
- **Data Fetching:** SWR

---

## Experience Zones

### Zone 1: News Arena (Home)
Living battlefield with 3D floating scrolls, chakra-aura cards, hand-seal category filters, breaking news crash-in effects, real-time ticker.

### Zone 2: Article Deep Dive
Immersive read with News DNA radar chart, bias spectrum bar, source credibility ninja ranks, AI summary scroll unfurl, chakra thread related articles.

### Zone 3: Trending Battleground
Topics as fighters with power levels, GSAP Flip position changes, WebSocket live updates, speed-line effects for rising topics.

### Zone 4: Globe (World View)
R3F 3D globe with GDELT event pins, region zoom, story spread arcs, day/night cycle, sentiment heatmap overlay.

### Zone 5: Creator Hub
3D Spline entrance portal, rich editor with anime toolbar, analytics as training progress, experiment lab for remixing visualizations, creator battles with weekly challenges.

### Zone 6: What-If Dimension
Purple Amaterasu theme, dimensional rift borders, AI speculative scenarios, confidence meters, community voting, reality fracture transitions.

### Zone 7: Stories (News Reels)
Full-screen vertical swipe, 15s auto-advance, ink-wash transitions, hexagonal story rings, chakra-charge progress bar.

### Zone 8: Profile & Gamification
3D flip ninja profile card, XP/rank system, achievement wall with particles, streak flames, daily quiz, tournament bracket leaderboard, cinematic rank-up animations.

---

## Data Pipeline

```
Sources (RSS, Reddit, GNews, GDELT)
    ↓ tools/scrapers/
Scrape & Normalize
    ↓ tools/analysis/deduplicate.py
Deduplicate (TF-IDF cosine similarity, threshold 0.8)
    ↓ tools/analysis/verify_news.py
Verify (4-level: source credibility → cross-confirm → fact-check → full)
    ↓ tools/ai/
AI Enrichment (sentiment, entities, bias, summaries, trending, what-ifs)
    ↓ api/
FastAPI + Socket.IO serves to frontend
    ↓ frontend/
Next.js renders the experience
```

---

## Build Phases

### Phase 1: Data Pipeline ✅ COMPLETE
- [x] RSS scraper (15 feeds)
- [x] GNews API scraper
- [x] Reddit scraper (8 subreddits)
- [x] GDELT scraper (geolocated events)
- [x] TF-IDF deduplication
- [x] Multi-level verification pipeline
- [x] Supabase schema (full)
- [x] Database query/store tools

### Phase 2: AI Tools
- [ ] Sentiment analysis (VADER)
- [ ] Article summarization (Claude API)
- [ ] Trending/power level calculation
- [ ] Named entity extraction (spaCy)
- [ ] Bias detection
- [ ] What-if scenario generation (Claude API)

### Phase 3: API Layer
- [ ] FastAPI app with CORS + Socket.IO
- [ ] Article endpoints (list, detail, breaking, related)
- [ ] Topic/trending endpoints
- [ ] Globe endpoints (events, heatmap, arcs)
- [ ] User/gamification endpoints
- [ ] What-if endpoints
- [ ] Stories endpoints
- [ ] Real-time event broadcasting

### Phase 4: Frontend Foundation
- [ ] Next.js 14 project setup
- [ ] Tailwind design system (colors, fonts, spacing, shadows)
- [ ] Global styles + Google Fonts
- [ ] Root layout + metadata
- [ ] Navbar with hand-seal navigation
- [ ] UI primitives (Button, Card, Badge, Loading)
- [ ] API client + SWR setup
- [ ] Socket.IO client

### Phase 5: News Arena (Home)
- [ ] 3D hero scene with floating scrolls
- [ ] Article cards with chakra auras
- [ ] Hand-seal category filters
- [ ] Breaking news crash-in effect
- [ ] Real-time news ticker
- [ ] Sentiment-reactive particle background

### Phase 6: Article Deep Dive
- [ ] Full-screen immersive layout
- [ ] News DNA radar chart
- [ ] Bias spectrum visualization
- [ ] Source credibility badges
- [ ] AI summary scroll unfurl
- [ ] Related articles with chakra threads

### Phase 7: Trending Battleground
- [ ] Power level fighters display
- [ ] GSAP Flip position transitions
- [ ] WebSocket live updates
- [ ] Topic arena drill-down
- [ ] Speed-line effects

### Phase 8: 3D Globe
- [ ] R3F globe with custom shaders
- [ ] GDELT event pins
- [ ] Region zoom interaction
- [ ] Story spread arcs
- [ ] Day/night cycle
- [ ] Sentiment heatmap

### Phase 9: Gamification
- [ ] XP + rank system
- [ ] Achievement badges with particle effects
- [ ] Streak tracking
- [ ] Daily quiz
- [ ] Leaderboard (tournament bracket)
- [ ] Rank-up cinematics

### Phase 10: Creator Hub + What-If + Stories
- [ ] Creator studio editor
- [ ] Creator analytics
- [ ] Experiment lab
- [ ] What-if dimension
- [ ] Story reels

### Phase 11: Polish & Deploy
- [ ] Performance optimization (lazy 3D, reduce particles mobile)
- [ ] prefers-reduced-motion fallbacks
- [ ] Lighthouse > 85
- [ ] Deploy (Vercel frontend, Railway/Render API)

---

## Brand Rules

### Colors (Strict — No Exceptions)
| Token | Hex | Usage |
|-------|-----|-------|
| chakraOrange | #FF6B00 | Primary actions, CTAs, energy effects |
| sharinganRed | #E63946 | Breaking news, negative, alerts |
| rasenganBlue | #00B4D8 | Links, verified, info |
| sageGreen | #2DC653 | Positive, success |
| amaterasuPurple | #7B2FBE | What-if, premium, creator |
| scrollCream | #F5E6C8 | Card highlights, parchment |
| shadowDark | #0A0A0F | Page background (ALWAYS) |
| inkBlack | #1A1A2E | Cards, modals, surfaces |
| mistGray | #8B8BA3 | Secondary text, metadata |

### Typography
| Use | Font | Weight |
|-----|------|--------|
| Logo/brand | Black Ops One | 400 |
| Headings | Rajdhani | 600-700 |
| Body | Inter | 400-600 |
| Data/stats | JetBrains Mono | 400 |

### Animation Timing
- Micro (hover): 150-250ms
- Component (card): 300-500ms
- Page transition: 600-900ms
- Cinematic (rank-up): 1.5-3s
- NEVER linear easing
- NEVER exceed 1s for user actions

---

## Rate Limits & Constraints
- GNews: 100 req/day
- Reddit: 100 req/min
- Claude API: Check billing, add delays between calls
- GDELT: No limit but 30s timeout
- Google Fact Check: Generous
- Google News RSS: Occasional 403 (retry after 5s)

---

## File Structure
```
NewsLens/
├── .env                    # Secrets (never commit)
├── .gitignore
├── CLAUDE.md               # WAT framework instructions
├── .tmp/                   # Temp processing files
├── tools/
│   ├── scrapers/           # RSS, GNews, Reddit, GDELT
│   ├── analysis/           # Dedup, verification
│   ├── ai/                 # Sentiment, summary, trending, entities, bias, what-if
│   ├── db/                 # Supabase query/store + schema
│   └── output/             # Export tools (future)
├── api/
│   ├── main.py             # FastAPI app
│   ├── config.py           # Settings
│   ├── models/             # Pydantic schemas
│   ├── routers/            # Endpoint handlers
│   └── services/           # Business logic
├── workflows/              # Markdown SOPs
└── frontend/
    └── src/
        ├── app/            # Next.js pages
        ├── components/     # React components
        └── lib/            # Utilities, API client
```
