# Workflow: Code Audit

## Objective
Run a comprehensive code audit before committing or shipping. Catches security vulnerabilities, memory leaks, scalability bombs, and code quality issues.

## When to Run
- Before every significant commit
- After completing a feature
- When user says "audit", "review", "ship it?"
- Automatically via pre-commit hook (future)

## Agent Chain
```
audit-orchestrator (master)
  ├── security-scanner (parallel)
  ├── leak-detector (parallel)
  └── scale-checker (parallel)
```

## Steps

### 1. Trigger
User invokes the audit-orchestrator agent (via `/audit` or directly).

### 2. Scope Detection
Orchestrator checks `git diff` to identify changed files. If clean tree, audits full `frontend/src/`.

### 3. Parallel Scanning
Three sub-agents run simultaneously:
- **security-scanner**: SSRF, XSS, rate limits, auth, secrets, CORS
- **leak-detector**: useEffect cleanup, intervals, connections, module state
- **scale-checker**: N+1 queries, caching, pagination, React perf, serverless limits

### 4. Aggregation & Scoring
Orchestrator collects all findings, deduplicates, scores (10-point scale), and delivers verdict.

### 5. Fix Cycle
If criticals found → fix immediately → re-audit → verify score improved.

## Scoring System
| Severity | Points |
|----------|--------|
| CRITICAL | -2 each |
| WARNING | -0.5 each |
| NITPICK | -0.1 each |

Score = 10 - deductions

## Verdicts
- < 5: DO NOT SHIP
- 5-7: SHIP WITH FIXES
- 7-8.5: ACCEPTABLE
- > 8.5: SHIP IT

## Key Files the Agents Must Check
- `lib/ssrf.ts` — shared SSRF protection (every fetch route must use it)
- `lib/rate-limit.ts` — rate limiting (every public API must use it)
- `lib/cache.ts` — SWR cache (module-level Maps need cleanup)
- `lib/redis.ts` — shared Redis singleton
- `lib/supabase/server.ts` — server Supabase client (singleton)
- `middleware.ts` — param validation, CORS, security headers

## Learned Constraints
- Hot-reload in dev creates duplicate `setInterval` on `globalThis` — always clear before re-creating
- Supabase free tier: 50 direct connections — singleton pattern mandatory
- Vercel serverless: 60s timeout, 1GB memory — no unbounded operations
- `dangerouslySetInnerHTML` requires `escapeHtml()` — never trust DB content directly
