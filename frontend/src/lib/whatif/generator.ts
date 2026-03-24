/*
  What-If Content Generator v2 — Genre Fusion × Stats × Humor

  Every article is a collision of two worlds:
  - "IPL meets Squid Game" / "Budget meets Black Mirror" / "Cricket meets Stock Market"
  - Relatable comparisons with real-world anchors
  - Stats, percentages, and numbered lists that FEEL real
  - Humor: chai-stall-uncle meets Twitter-pundit energy
  - Outcomes named like movie tropes, not corporate jargon

  Content types: hot_take, deep_dive, versus, prediction, timeline
*/

import type { GeneratedScenario } from "./types";

interface TrendInput {
  title: string;
  traffic: string;
  relatedQueries: string[];
  url: string;
}

// ── Regional keywords for category detection ──

const REGIONAL_SPORTS: Record<string, string[]> = {
  in: [
    "cricket", "ipl", "wicket", "kohli", "dhoni", "bumrah", "rohit sharma",
    "rcb", "csk", "mi", "srh", "kkr", "dc", "pbks", "gt", "lsg", "rr",
    "bcci", "test match", "odi", "t20", "ranji", "kabaddi", "pro kabaddi",
    "badminton", "pv sindhu", "neeraj chopra", "hockey india",
  ],
  us: [
    "nfl", "nba", "mlb", "nhl", "super bowl", "touchdown", "home run",
    "lebron", "curry", "mahomes", "world series", "stanley cup",
    "march madness", "ncaa", "mls", "draft pick",
  ],
  gb: [
    "premier league", "epl", "arsenal", "chelsea", "liverpool", "man city",
    "man united", "tottenham", "fa cup", "the ashes", "rugby", "wimbledon", "f1",
  ],
  de: ["bundesliga", "bayern", "dortmund", "dfb", "handball", "formula 1"],
  fr: ["ligue 1", "psg", "mbappe", "roland garros", "tour de france"],
  jp: ["npb", "baseball", "j-league", "sumo", "shohei ohtani"],
  au: ["afl", "nrl", "cricket australia", "ashes", "australian open"],
  br: ["brasileirão", "flamengo", "palmeiras", "neymar", "copa libertadores"],
  ca: ["nhl", "hockey", "maple leafs", "cfl", "raptors", "blue jays"],
};

const REGIONAL_POLITICS: Record<string, string[]> = {
  in: ["bjp", "congress", "modi", "rahul gandhi", "lok sabha", "rajya sabha", "rbi"],
  us: ["trump", "biden", "democrat", "republican", "senate", "white house"],
  gb: ["labour", "conservative", "starmer", "parliament", "downing street"],
  de: ["bundestag", "scholz", "spd", "cdu", "afd"],
  fr: ["macron", "assemblée", "le pen"],
  jp: ["diet", "ldp", "kishida"],
  au: ["albanese", "liberal party", "labor"],
  br: ["lula", "bolsonaro", "congresso"],
  ca: ["trudeau", "parliament", "liberal", "conservative"],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  politics: ["election", "minister", "parliament", "government", "bill", "law", "policy", "president", "senate", "vote", "diplomat", "sanction", "protest", "opposition", "cabinet", "referendum"],
  economy: ["market", "stock", "dollar", "gdp", "inflation", "trade", "tax", "budget", "recession", "crypto", "bitcoin", "fed", "interest rate", "startup", "ipo", "investment", "unemployment", "tariff", "rupee", "sensex", "nifty", "rbi"],
  tech: ["ai", "artificial intelligence", "chatgpt", "openai", "google", "apple", "meta", "microsoft", "software", "app", "robot", "chip", "semiconductor", "quantum", "spacex", "tesla", "5g", "cybersecurity", "hack", "cloud", "blockchain"],
  sports: ["match", "fifa", "olympics", "player", "team", "goal", "medal", "champion", "league", "world cup", "tennis", "f1", "grand prix"],
  entertainment: ["movie", "bollywood", "hollywood", "actor", "actress", "netflix", "album", "concert", "oscar", "grammy", "series", "disney", "box office", "trailer", "celebrity", "k-pop", "music"],
  society: ["climate", "environment", "education", "health", "hospital", "pandemic", "vaccine", "pollution", "flood", "earthquake", "disaster", "poverty", "migration", "refugee", "culture"],
};

function detectCategory(trend: TrendInput, country: string = "in"): string {
  const text = `${trend.title} ${trend.relatedQueries.join(" ")}`.toLowerCase();
  let best = "general";
  let bestScore = 0;
  const regionalSports = REGIONAL_SPORTS[country] || [];
  const regionalPolitics = REGIONAL_POLITICS[country] || [];
  const merged: Record<string, string[]> = {
    ...CATEGORY_KEYWORDS,
    sports: [...CATEGORY_KEYWORDS.sports, ...regionalSports],
    politics: [...CATEGORY_KEYWORDS.politics, ...regionalPolitics],
  };
  for (const [cat, kws] of Object.entries(merged)) {
    const score = kws.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

// ── Seeded pseudo-random for deterministic generation ──

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

// ── Genre Fusion Crossovers ──

const CROSSOVERS = [
  "Game of Thrones", "Squid Game", "Black Mirror", "The Office",
  "Avengers", "Inception", "Breaking Bad", "Money Heist",
  "Interstellar", "The Matrix", "Shark Tank", "Bigg Boss",
  "IPL Auction", "Stock Market", "Startup Pitch", "Board Exam",
  "Family WhatsApp Group", "LinkedIn Post", "Twitter Thread",
  "Amul Topical", "Reddit AMA", "Anime Arc", "K-Drama",
];

// ── Title templates with genre fusion ──

interface TitleGen { title: (topic: string, crossover: string) => string; description: string }

const FUSION_TITLES: Record<string, TitleGen[]> = {
  sports: [
    { title: (t, c) => `${t} meets ${c}: Here's the scenario nobody's ready for`, description: "When two worlds collide, the predictions get wild." },
    { title: (t) => `If ${t} was a stock, would you buy, hold, or sell?`, description: "Treating sports like the market — because the stakes feel the same." },
    { title: (t, c) => `The ${c} version of ${t} — and why it's scarily accurate`, description: "Pop culture parallels that hit different when you see the data." },
    { title: (t) => `${t}: 3 stats that will change how you see everything`, description: "Numbers don't lie. But they do tell interesting stories." },
    { title: (t) => `What your take on ${t} says about you (a scientific analysis)`, description: "Your hot take is a personality test. We ran the numbers." },
  ],
  politics: [
    { title: (t, c) => `${t} but make it ${c} — the scenario playing out right now`, description: "Fiction writers couldn't script this. But reality just did." },
    { title: (t) => `${t}: The 5 dominoes that fall next (with receipts)`, description: "Political chain reactions mapped out with uncomfortable accuracy." },
    { title: (t, c) => `If ${t} was an episode of ${c}, we're at the season finale`, description: "The plot twists are writing themselves." },
    { title: (t) => `The math behind ${t} that nobody's talking about`, description: "Forget the hot takes. The numbers tell a different story." },
  ],
  economy: [
    { title: (t) => `${t}: How this hits your wallet in the next 90 days`, description: "Forget GDP. Here's what changes at the grocery store." },
    { title: (t, c) => `${t} × ${c}: The crossover episode your portfolio didn't expect`, description: "When economics meets pop culture, the analogies are *chef's kiss*." },
    { title: (t) => `Your EMI, your FD, your job — the ${t} impact calculator`, description: "A scenario breakdown for real humans, not Bloomberg terminals." },
    { title: (t) => `If ${t} was explained to a 10-year-old (and why adults need this)`, description: "Simple explanations for complex situations. No jargon, we promise." },
  ],
  tech: [
    { title: (t, c) => `${t} is the ${c} of tech — and here's the proof`, description: "The parallel is so clean it's almost suspicious." },
    { title: (t) => `${t}: The 7-day countdown to everything changing`, description: "A timeline of disruption that's already started." },
    { title: (t, c) => `What happens when ${t} meets ${c}? We simulated it.`, description: "AI-powered scenario modeling for the thing everyone's debating." },
    { title: (t) => `${t} explained through pizza delivery (seriously, it works)`, description: "The analogy that makes complex tech click instantly." },
  ],
  entertainment: [
    { title: (t, c) => `${t} + ${c} = the crossover nobody asked for but everyone needs`, description: "Pop culture collision that breaks the internet and possibly your brain." },
    { title: (t) => `The ${t} effect: 4 industries that just felt the tremor`, description: "Entertainment isn't just entertainment anymore. It's economics." },
    { title: (t) => `Ranking every possible outcome of ${t} (tier list edition)`, description: "S-tier to F-tier. Fight us in the comments." },
  ],
  society: [
    { title: (t, c) => `${t} is giving ${c} energy and we need to talk about it`, description: "The vibes are eerily familiar. Here's the full comparison." },
    { title: (t) => `${t}: The stat that made us do a double-take (and 4 more)`, description: "Data-driven reality check on the thing everyone has opinions about." },
    { title: (t) => `Your grandkids will ask about ${t}. Here's what to tell them.`, description: "Some moments are footnotes. This one might be a chapter." },
  ],
  general: [
    { title: (t, c) => `${t} meets ${c}: The scenario that just got real`, description: "Two worlds collide. The predictions write themselves." },
    { title: (t) => `5 things about ${t} that sound fake but are 100% real`, description: "Truth is stranger than fiction. We checked." },
    { title: (t, c) => `If ${t} was a ${c} episode, here's which season we're in`, description: "Pop culture is the best lens for understanding reality." },
    { title: (t) => `The ${t} situation in 4 charts and 1 uncomfortable truth`, description: "Visual storytelling for people who scroll past walls of text." },
  ],
};

// ── Article body generators with stats, humor, comparisons ──

const CONTENT_TYPES = ["hot_take", "deep_dive", "versus", "prediction", "timeline"] as const;

function generateHotTake(title: string, trend: string, category: string, related: string, crossover: string): string {
  return `## The Situation

**${trend}** has dominated headlines and social feeds over the past 48 hours. Beneath the noise, a more nuanced picture is emerging — one that most hot takes are missing entirely.

${title} may sound like speculation, but historical precedent suggests otherwise. The last time a comparable ${category} event reached this velocity, the outcome defied every mainstream prediction.

## The ${crossover} Parallel

In **${crossover}**, the consensus was confidently wrong — and the minority view turned out to be prescient. The pattern repeating around ${trend} is striking.

| Indicator | Consensus View | Emerging Signal |
|-----------|---------------|-----------------|
| Momentum | Slowing down | Accelerating 3x vs. last month |
| Public Sentiment | 70-30 split | Closer to 52-48 |
| Institutional Positioning | Following the crowd | Quietly contrarian |

## Three Numbers That Matter

- **72%** — The rate at which the "obvious" prediction proves wrong in analogous ${category} situations.
- **48 hours** — The decision window. After this, the narrative hardens and repositioning becomes costly.
- **${related}** — The correlated signal that few are connecting to ${trend}, but should be.

## The Ground-Level Signal

Official commentary and expert panels tell one story. Ground-level sentiment — group chats, regional forums, street-level indicators — tells another. In situations like this, the ground often leads the narrative by two to three weeks.

*The crowd is not always right. But its early signals deserve serious attention.*

## What Comes Next

**${title}** — the data points in one direction, but the prevailing assumption points in another. That gap is where the real story lives.

*Cast your prediction below. The aggregate view often outperforms individual expert calls.*`;
}

function generateDeepDive(title: string, trend: string, _category: string, related: string, crossover: string): string {
  return `## Beyond the Headlines

**${trend}** has moved past the initial reaction phase. The headline-level takes are in. What follows is a deeper examination of the forces at play — and why the second-order effects matter more than the first.

**${title}** carries a probability that most analysts are under-pricing. When the evidence is laid out systematically, the picture shifts considerably.

## The Evidence

### Trend Velocity
${trend} is not following the typical news cycle decay curve. Its engagement velocity matches only three comparable events in the past decade — all of which preceded significant structural shifts.

### The Capital Signal
When ${related} began moving, institutional players were already positioned. This suggests informed actors identified the trajectory weeks before public attention caught up.

### The Absence Pattern
The voices that are typically loudest on matters like ${trend} have been notably measured. In both political and market contexts, calibrated silence from key actors is itself a data point.

## Scenario Analysis

### Path A: Controlled Resolution — 35% probability
${trend} follows the standard arc: peak, plateau, fade. The status quo absorbs the disruption. This is the baseline assumption most observers are pricing in.

### Path B: Compounding Escalation — 45% probability
${related} amplifies the original signal. The conversation shifts fundamentally within 30 days. **Historical pattern matching favours this outcome.**

### Path C: The ${crossover} Inflection — 20% probability
An exogenous variable reshapes the situation entirely. Low likelihood, high impact — the asymmetric scenario that prudent analysis cannot ignore.

## Signal vs. Noise

- **Signal:** Institutional behaviour — track what they do, not what they say
- **Signal:** ${related} as a leading indicator
- **Noise:** High-volume social media reaction (engagement does not equal insight)
- **Noise:** Consensus expert predictions (often repackaged conventional wisdom)

## Assessment

**${title}** is not a hypothetical to dismiss — it is a scenario to prepare for. Early positioning consistently outperforms late reaction. The evidence points somewhere worth watching.

*Share your assessment below. Anonymous aggregate predictions often outperform individual expert forecasts.*`;
}

function generateVersus(title: string, trend: string, category: string, related: string, crossover: string): string {
  return `## The Divide

**${title}** — expert opinion is split, public sentiment is polarised, and the data supports credible arguments on both sides. Here is a structured breakdown of each position.

## The Case for Structural Change

Proponents argue that ${trend} represents a generational shift rather than a cyclical event. The evidence:

- **Historical pattern:** The last time a ${category} situation exhibited this exact trajectory, the aftermath reshaped the landscape for years.
- **The ${crossover} factor:** ${related} is the variable that transforms ${trend} from a headline into a structural story — much like the pivotal turn in ${crossover}.
- **Persistence metric:** Events that sustain this level of engagement for this duration resolve as the "it'll blow over" camp expects only 27% of the time.

## The Case for Mean Reversion

Sceptics counter with equally compelling points:

- **Recency bias:** Most events that feel unprecedented have historical analogues. The base rate for genuine paradigm shifts is lower than it feels in the moment.
- **Algorithmic amplification:** ${trend} is trending in part because controversy drives engagement. The signal may be weaker than the volume suggests.
- **Statistical base rates:** Roughly 85% of "everything changes" events settle back toward the prior trajectory within 90 days.

## Side-by-Side Assessment

| Factor | Change Thesis | Stability Thesis |
|--------|--------------|-----------------|
| Data support | Strong | Moderate |
| Historical precedent | Mixed | Favoured |
| Expert consensus | Divided | Divided |
| Institutional positioning | Active | Wait-and-see |

## The Middle Ground

The most likely outcome may be partial: ${trend} alters specific dimensions meaningfully while leaving others largely unchanged. The ${crossover} parallel applies — the real shift is not that one side prevails, but that the debate itself permanently recalibrates both positions.

*Where do you stand? Cast your prediction below. We revisit in 30 days.*`;
}

function generatePrediction(title: string, trend: string, _category: string, related: string, crossover: string): string {
  return `## Prediction Market

**${trend}** has reached an inflection point. The signals are mixed, the expert consensus is unusually fragmented, and the next 72 hours will likely determine which trajectory holds.

## Why the Timing Matters

A week ago, this question was premature. A week from now, it becomes hindsight. The current moment sits at the point of maximum uncertainty — and maximum informational value.

- **${related}** is sending contradictory signals across different timeframes
- Expert commentary has shifted from confident to hedged — a historically reliable indicator of genuine uncertainty
- Public sentiment is split close to 50-50, which in comparable situations has favoured the minority position

## Key Metrics

- **67%** of analogous situations resolved within 14 days of reaching this engagement threshold
- **${related}** correlation with ${trend} is at its highest point in the dataset
- The gap between stated expert confidence and actual positioning is widening — a pattern also seen in the **${crossover}** parallel

## The Forecasting Principle

Research on superforecasting consistently shows that the best predictors share one trait: they update beliefs based on evidence rather than anchoring to initial positions.

Given the current state of ${trend}, the movement in ${related}, and the broader context — what is the most probable outcome?

*Your prediction contributes to a collective intelligence model. Aggregate forecasts consistently outperform individual expert calls.*`;
}

function generateTimeline(title: string, trend: string, _category: string, related: string, crossover: string): string {
  return `## Projected Timeline

Major events follow recognisable patterns. The ${trend} trajectory has been mapped against comparable situations from the past decade, drawing on the **${crossover}** framework for structural parallels.

## Week 1: Critical Mass
*Current phase.*

${trend} has crossed from niche awareness into mainstream discourse. At this stage, the signal-to-noise ratio is at its lowest — approximately 70% of circulating commentary is reactive rather than analytical.

**Key indicator:** ${related}. Movement in this variable historically marks the transition from speculation to positioning.

## Week 2-3: Institutional Response

The initial reaction phase ends. What follows is typically invisible to the general public: institutional repositioning, strategic communication shifts, and capital reallocation.

**Historical pattern:** In 78% of comparable situations, the most consequential moves occurred in week two, not week one. The initial headline is the catalyst; the response is the substance.

## Month 1-2: Structural Revelation

The true scope of ${trend} becomes measurable. Early movers are validated; late responders face asymmetric costs.

Two trajectories emerge:
- **Stabilisation:** The situation resolves into a new equilibrium — different from the prior state, but manageable. Adjustment is required but contained.
- **Second-order effects:** Consequences that were not mapped in the initial analysis phase surface, driven by the interaction between ${trend} and ${related}.

## Month 3-6: The Settled Landscape

The news cycle has moved on, but the structural changes triggered by ${trend} persist. The trending topic was temporary; the shift it catalysed is not.

**The consistent lesson across every analogous event:** Those who distinguished between the headline and the underlying shift gained a meaningful advantage — typically measured in months, not days.

## Your Assessment

**${title}** — at which point on this timeline does the highest-impact decision need to be made?

*Your prediction below contributes to the collective forecast model.*`;
}

// ── Outcome sets — named like movie tropes ──

const OUTCOME_SETS: Record<string, { label: string; description: string }[][]> = {
  sports: [
    [
      { label: "The Anime Comeback Arc", description: "Against all odds, the underdog rewrites history" },
      { label: "The Script is Broken", description: "Chaos. Nobody predicted this. Twitter implodes." },
      { label: "The Corporate Ending", description: "The money wins. The expected result. Boring but profitable." },
      { label: "The Meme That Became Real", description: "What started as a joke... isn't funny anymore" },
    ],
    [
      { label: "Dynasty Mode Activated", description: "Dominance confirmed. Records broken. Rivals in shambles." },
      { label: "The Great Equalizer", description: "Everything resets. The playing field just got leveled." },
      { label: "Plot Armor Failed", description: "The favorite falls. The narrative dies. Reality bites." },
    ],
  ],
  politics: [
    [
      { label: "House of Cards IRL", description: "The power play works. The chess move lands." },
      { label: "The People's Twist", description: "Ground-level revolt that the polls completely missed" },
      { label: "Status Quo Wins Again", description: "All that noise... for this? The system absorbs the shock." },
      { label: "The Alliance Nobody Expected", description: "Former enemies shake hands. Everyone's confused." },
    ],
  ],
  economy: [
    [
      { label: "Your Wallet Feels This", description: "Direct hit. Prices, rates, or jobs shift noticeably." },
      { label: "The Smart Money Trade", description: "While everyone panicked, someone got rich. As always." },
      { label: "The Soft Landing", description: "Crisis averted. Markets shrug. Your FD rate stays the same." },
      { label: "The Domino Run", description: "One thing falls, then another, then another..." },
    ],
  ],
  tech: [
    [
      { label: "The iPhone Moment", description: "We look back at this as before/after. No going back." },
      { label: "Cool Demo, Dead Product", description: "Impressive on stage. Useless in real life. Classic." },
      { label: "The Quiet Revolution", description: "Nobody noticed the change until it was everywhere" },
      { label: "The Hype Cycle Strikes Again", description: "Peak of inflated expectations → trough of disillusionment" },
    ],
  ],
  entertainment: [
    [
      { label: "Cultural Reset", description: "Everyone references this for years. It's in the memes." },
      { label: "24-Hour News Cycle Victim", description: "Viral Monday. Forgotten Wednesday. Classic internet." },
      { label: "The Franchise Moment", description: "This becomes a blueprint. Copycats incoming." },
    ],
  ],
  default: [
    [
      { label: "The Black Swan", description: "Nobody — NOBODY — saw this coming. Textbooks rewritten." },
      { label: "Exactly As Vibes Predicted", description: "The gut feeling was right. The data catches up." },
      { label: "The Long Game", description: "Nothing happens fast. Everything happens eventually." },
      { label: "The Plot Twist", description: "The real story was something else entirely" },
    ],
  ],
};

// ── Main generator ──

export function generateScenarios(trends: TrendInput[], country: string = "in"): GeneratedScenario[] {
  const scenarios: GeneratedScenario[] = [];

  for (let i = 0; i < trends.length; i++) {
    const trend = trends[i];
    const category = detectCategory(trend, country);
    const contentType = CONTENT_TYPES[i % CONTENT_TYPES.length];
    const seed = hashStr(trend.title);

    // Pick a genre crossover
    const crossover = pick(CROSSOVERS, seed);

    // Pick title template
    const catTitles = FUSION_TITLES[category] || FUSION_TITLES.general;
    const tmpl = pick(catTitles, seed + i);
    const title = tmpl.title(trend.title, crossover);
    const description = tmpl.description;

    const related = trend.relatedQueries.slice(0, 3).join(", ") || "connected signals";

    // Generate body based on content type
    let body: string;
    switch (contentType) {
      case "deep_dive":
        body = generateDeepDive(title, trend.title, category, related, crossover);
        break;
      case "versus":
        body = generateVersus(title, trend.title, category, related, crossover);
        break;
      case "prediction":
        body = generatePrediction(title, trend.title, category, related, crossover);
        break;
      case "timeline":
        body = generateTimeline(title, trend.title, category, related, crossover);
        break;
      default:
        body = generateHotTake(title, trend.title, category, related, crossover);
    }

    // Pick outcomes
    const catOutcomes = OUTCOME_SETS[category] || OUTCOME_SETS.default;
    const outcomes = pick(catOutcomes, seed);

    const readTime = contentType === "prediction" ? 2 : contentType === "deep_dive" ? 5 : contentType === "versus" ? 4 : 3;

    scenarios.push({
      title,
      description,
      body,
      content_type: contentType === "hot_take" ? "article" : contentType === "deep_dive" ? "analysis" : contentType === "versus" ? "case_study" : "prediction",
      read_time: readTime,
      source_trend: trend.title,
      source_trend_url: trend.url,
      category,
      is_ai_generated: true,
      country,
      outcomes,
    });
  }

  return scenarios;
}
