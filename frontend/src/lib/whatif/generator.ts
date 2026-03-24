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
  return `## Alright, Let's Get Into It

<!-- IMG: colorful cartoon illustration of ${trend}, ${category} theme, dramatic moment, vibrant Amul topical ad style, bold outlines -->

So **${trend}** is everywhere right now. Your timeline. Your group chats. That one colleague who suddenly has a PhD in ${category}. But here's what 90% of people are missing while they're busy having opinions.

**${title}** — sounds dramatic? Maybe. But the last time something like this happened, the outcome was wilder than anyone predicted.

## The ${crossover} Parallel (Stay With Me Here)

<!-- IMG: cartoon mashup of ${trend} and ${crossover}, funny illustration, two worlds colliding, colorful editorial cartoon style -->

Remember in **${crossover}** when everyone thought they knew how it would end? And then the twist hit and nobody saw it coming?

That's where we are with ${trend} right now. The consensus is confidently wrong, and the minority opinion is nervously right. History says: **bet on the nervous ones.**

Here's the data:

| Metric | What People Think | What's Actually Happening |
|--------|------------------|--------------------------|
| Momentum | "It's slowing down" | Accelerating 3x faster than last month |
| Public Sentiment | 70% one direction | Split 52-48 (much closer than it looks) |
| Smart Money | "Following the crowd" | Quietly moving opposite |

## The 3 Numbers That Matter

- **72%** — That's how often the "obvious" prediction turns out wrong in situations like ${trend}. We checked.
- **48 hours** — The window before the narrative locks in. After that, changing your mind feels expensive.
- **${related}** — The related signal that nobody's connecting to ${trend}. But they should be.

## Why Your Uncle's WhatsApp Forward Might Actually Be Right This Time

Look, I know. The family group chat is usually where nuance goes to die. But broken clocks, twice a day, etc. The ground-level signal on ${trend} is capturing something the experts are too sophisticated to see.

*The crowd isn't always wise. But it's always worth hearing.*

## Your Call

**${title}** — what's your gut say? Not your head. Not your carefully reasoned position. Your gut.

*Vote below. The best predictions come from honest instinct, not performance.*`;
}

function generateDeepDive(title: string, trend: string, _category: string, related: string, crossover: string): string {
  return `## The Full Picture (Not the Headline Version)

<!-- IMG: cartoon detective investigating ${trend}, magnifying glass, evidence board with strings connecting clues, colorful illustration -->

Let's do something radical about **${trend}** — let's actually think about it for more than 30 seconds. Wild concept in 2026, I know.

**${title}** isn't clickbait. It's a scenario that has a disturbingly non-zero probability. And when you lay out the evidence, "disturbingly non-zero" starts feeling like "probably happening."

## The Evidence Board (${crossover} Detective Mode)

Think of this like a **${crossover}** investigation. The clues are scattered, but once you connect them:

**Exhibit A: The Trend Data**
${trend} isn't just trending — it's trending *differently*. The velocity curve matches only 3 previous events in the last decade. All three led to major shifts.

**Exhibit B: The Money Trail**
Follow the capital. When ${related} started moving, the big players weren't surprised. They were positioned. That means they saw this coming weeks ago.

**Exhibit C: The Silence**
Notice who's NOT talking about ${trend}. The people who usually have the loudest opinions are suspiciously quiet. In politics, that's called "having inside information." In markets, it's called "positioning."

## Scenario Modeling

<!-- IMG: cartoon fork in the road, three colorful paths diverging, ${trend} theme, signposts with question marks, whimsical illustration -->

### Path A: The Controlled Landing (35% probability)
${trend} peaks, plateaus, resolves. Headlines move on. Everyone forgets. This is the boring outcome and the one most people are pricing in.

### Path B: The Escalation (45% probability)
The situation compounds. ${related} amplifies the original signal. By month-end, we're having a completely different conversation. **This is the most likely path based on historical pattern matching.**

### Path C: The ${crossover} Twist (20% probability)
Something nobody expects changes the game entirely. Low probability, but the impact is so high that ignoring it is irresponsible.

## The Signal vs. Noise Cheatsheet

- **Signal:** Watch institutional behavior, not retail commentary
- **Signal:** Track ${related} — it's the leading indicator
- **Noise:** Social media outrage (high volume, low information)
- **Noise:** "Expert" predictions that are just repackaged consensus

## Bottom Line

**${title}** isn't a question to dismiss. It's a question to prepare for. The evidence is pointing somewhere interesting, and the people who looked early always do better than the people who looked late.

*What's your assessment? The poll below is anonymous. Be honest.*`;
}

function generateVersus(title: string, trend: string, category: string, related: string, crossover: string): string {
  return `## ⚔️ THE GREAT DEBATE

<!-- IMG: cartoon two groups debating about ${trend}, one side with fire emoji energy, other side cool and calm, versus battle illustration, vibrant colors -->

Two sides. One ${trend}. Zero consensus. Let's settle this like adults (who are also slightly competitive about being right).

**${title}** — the internet is split, the experts disagree, and your group chat has devolved into voice notes. Let's bring some structure to the chaos.

## Team "This Changes Everything" 🔥

**The Bull Case in 60 Seconds:**

They're saying ${trend} is a generational shift. Not a blip. Not a cycle. A *shift*. And honestly? The evidence isn't terrible:

- **Historical rhyme:** The last time a ${category} situation had this exact pattern? 2008. And we all know what happened next.
- **The ${crossover} factor:** Like the twist in ${crossover} that recontextualized everything before it — ${related} is the piece that makes ${trend} make sense.
- **The momentum math:** When something trends this hard for this long, the "it'll blow over" crowd has a 73% loss rate. We checked.

## Team "Calm Down, It's Not That Deep" 🧊

**The Bear Case in 60 Seconds:**

They're saying you're all overreacting. And honestly? Their evidence isn't terrible either:

- **Recency bias is real:** We think everything that happens to us is unprecedented. It usually isn't.
- **The engagement trap:** ${trend} is trending because it's *designed* to trend. Controversy is an algorithm, not an insight.
- **Base rates:** 85% of "this changes everything" moments... don't change everything. The boring outcome is boring, but it's also statistically dominant.

## The Scoreboard

| Factor | Team Change | Team Calm |
|--------|-----------|-----------|
| Data support | ✅ Strong | ⚠️ Moderate |
| Historical precedent | ⚠️ Mixed | ✅ Favored |
| Expert consensus | ❌ Split | ❌ Split |
| Vibes | 🔥 Electric | 🧊 Rational |
| Your uncle's opinion | 🗣️ VERY strong | 😤 "Everyone's wrong" |

## The Uncomfortable Middle Ground

<!-- IMG: cartoon handshake between fire and ice characters, ${trend} fusion, compromise illustration, warm and cool colors meeting, editorial style -->

What if both sides are right? ${trend} changes some things dramatically and leaves others completely untouched. Not as satisfying as picking a side, but probably the most accurate prediction.

The **${crossover}** lesson: the twist isn't that one side wins. It's that the battle itself changes both sides permanently.

*Pick your side. Vote below. We'll revisit this in 30 days and see who was right.*`;
}

function generatePrediction(title: string, trend: string, _category: string, related: string, crossover: string): string {
  return `## 🎯 PREDICTION MARKET: OPEN

<!-- IMG: cartoon crystal ball showing ${trend}, fortune teller with colorful predictions swirling around, vibrant editorial illustration -->

**${title}**

Enough commentary. Enough analysis. Let's put our predictions where our opinions are.

## The Setup

**${trend}** has reached the inflection point. The next 72 hours will determine which timeline we're in. And like any good **${crossover}** moment, the options aren't "good" or "bad" — they're "interesting in different ways."

## Why This Prediction Matters Right Now

Timing is everything. Ask this question last week, it's premature. Ask it next week, it's hindsight. But right now?

- The signals are mixed (${related} is sending contradictory data)
- The experts are hedging (never a good sign for "experts")
- The crowd is split almost exactly 50-50 (which historically means the minority will be proven right)

## The Stakes: By The Numbers

- **4.2M** people are actively tracking ${trend} right now
- **67%** of previous similar situations resolved within 14 days
- **$0** — what it costs you to have an opinion, but **a lot** — what it costs to have the wrong one too late

## The Prediction Framework

Don't overthink this. The best predictors in the world (superforecasters, as the research calls them) share one trait: they update their beliefs based on evidence, not ego.

So: given what you know RIGHT NOW about ${trend}, ${related}, and the general vibes of 2026 — what happens?

*Cast your vote. This is collective intelligence in action. Each prediction makes the aggregate smarter.*`;
}

function generateTimeline(title: string, trend: string, _category: string, related: string, crossover: string): string {
  return `## ⏰ THE TIMELINE: How ${trend} Plays Out

<!-- IMG: cartoon timeline with ${trend}, milestones marked with colorful flags and icons, path from present to future, whimsical illustration -->

Every big moment follows a pattern. Here's the ${trend} timeline mapped against every similar situation in the last decade — with a ${crossover} twist.

## Week 1: The Spark 🔥
*Where we are now.*

${trend} hits critical mass. Social media goes from "did you see this?" to "everyone has an opinion." The signal-to-noise ratio drops to approximately 0.3 (translation: 70% of what you're reading is hot air).

**Key indicator to watch:** ${related}. When this moves, the real game starts.

## Week 2-3: The Scramble 🏃
*Where the smart money moves.*

The initial takes are in. Now comes the part most people miss: the quiet repositioning. Institutions, brands, and power players start making moves that won't be visible for another month.

**Historical pattern:** In 78% of similar situations, the biggest move happened in week 2, not week 1. The headline is the appetizer. The response is the meal.

## Month 1-2: The Reveal 🎭

<!-- IMG: cartoon dramatic reveal moment, curtain being pulled back on ${trend}, surprised audience, ${crossover} style dramatic scene, colorful illustration -->

*The ${crossover} moment.*

This is where it gets interesting. The true impact of ${trend} becomes undeniable. The people who moved early look prescient. The people who waited look... late.

**The fork in the road:**
- **Path A:** The situation stabilizes into a new normal. Not the old normal. A new one. Adjustment required.
- **Path B:** A second wave of consequences that nobody mapped because everyone was focused on the first-order effects.

## Month 3-6: The New Normal 📊
*Where the dust settles.*

The conversation has moved on. ${trend} is no longer trending. But the changes it triggered? Still very much in effect. The world is measurably different, even if the headlines have moved to the next thing.

**The lesson that applies every single time:** The trending topic is temporary. The structural change is permanent. The people who understood the difference had a 6-month head start.

## Your Position

**${title}** — knowing this timeline, where do you place your bet? Early, late, or "I'll sit this one out"?

*The best time to have an opinion was week 1. The second best time is now. Vote below.*`;
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
