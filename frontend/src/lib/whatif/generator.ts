/*
  What If Content Generator — transforms trending topics into rich, relatable articles.

  Each article reads like it was written by a passionate expert who LIVES the topic:
  - Sports → cricket-obsessed fan who knows every stat
  - Tech → Silicon Valley insider who sees the real implications
  - Economy → your smart friend who explains markets over chai
  - Politics → sharp political commentator who cuts through noise

  Content types rotate: article, analysis, case_study, prediction
*/

import type { GeneratedScenario } from "./types";

interface TrendInput {
  title: string;
  traffic: string;
  relatedQueries: string[];
  url: string;
}

// ── Category detection ──

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  politics: [
    "election", "minister", "parliament", "government", "bjp", "congress",
    "bill", "law", "policy", "modi", "president", "senate", "vote",
    "diplomat", "sanction", "protest", "rally", "opposition", "cabinet",
    "supreme court", "governor", "trump", "biden", "referendum",
  ],
  economy: [
    "market", "stock", "rupee", "dollar", "gdp", "inflation", "trade",
    "tax", "rbi", "budget", "recession", "crypto", "bitcoin", "sensex",
    "nifty", "fed", "interest rate", "startup", "ipo", "investment",
    "unemployment", "oil price", "export", "import", "tariff",
  ],
  tech: [
    "ai", "artificial intelligence", "chatgpt", "openai", "google",
    "apple", "meta", "microsoft", "software", "app", "robot", "chip",
    "semiconductor", "quantum", "spacex", "tesla", "5g", "cybersecurity",
    "hack", "data breach", "cloud", "blockchain", "neural",
  ],
  sports: [
    "cricket", "ipl", "match", "fifa", "olympics", "player", "team",
    "goal", "wicket", "kohli", "dhoni", "ronaldo", "messi", "world cup",
    "tennis", "f1", "grand prix", "medal", "champion", "league",
    "rcb", "csk", "mi", "srh", "kkr", "dc", "pbks", "gt", "lsg", "rr",
  ],
  entertainment: [
    "movie", "bollywood", "hollywood", "actor", "actress", "netflix",
    "album", "concert", "oscar", "grammy", "series", "disney",
    "box office", "trailer", "celebrity", "k-pop", "tollywood", "music",
  ],
  society: [
    "climate", "environment", "education", "health", "hospital",
    "pandemic", "vaccine", "pollution", "flood", "earthquake",
    "disaster", "poverty", "inequality", "migration", "refugee",
    "religion", "culture", "population", "water",
  ],
};

function detectCategory(trend: TrendInput): string {
  const text = `${trend.title} ${trend.relatedQueries.join(" ")}`.toLowerCase();
  let best = "general";
  let bestScore = 0;
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = kws.filter((kw) => text.includes(kw)).length;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

const CONTENT_TYPES = ["article", "analysis", "case_study", "prediction"] as const;

// ── RELATABLE article bodies — written like an expert, not a robot ──

function generateArticleBody(title: string, trend: string, category: string, relatedQueries: string[]): string {
  const related = relatedQueries.slice(0, 3).join(", ") || "related developments";

  if (category === "sports") return `## Look, Here's What Nobody's Talking About

Everyone's buzzing about **${trend}** right now — your group chats, Twitter, the uncle at the chai stall who suddenly becomes a cricket analyst every season. But while everyone's reacting to what just happened, let's talk about what happens NEXT.

**${title}** — sounds dramatic? Maybe. But if you've followed the sport long enough, you know the "impossible" scenarios are the ones that actually happen. Remember when nobody gave a chance to that underdog team? Remember when that one decision in the final over changed everything?

## The Domino Effect You're Not Seeing

Here's what makes this interesting. ${trend} isn't just a headline — it's a pressure point. Pull this thread and watch what unravels:

- **Player dynamics shift overnight.** When the narrative changes, so do the power equations. Contracts, endorsements, captaincy debates — everything's on the table.
- **Fan sentiment is a real force.** Don't underestimate millions of passionate fans. Social media campaigns have literally changed team decisions before.
- **The money follows the story.** Sponsors, broadcasters, franchise owners — they're all watching ${trend} and recalculating. ${related} are already being affected.

## What History Tells Us

Every sport has its "before and after" moments. The moments where you can draw a line and say "nothing was the same after this." Is ${trend} one of those moments? The early signs say... maybe.

The closest parallel? Think back to when a similar situation played out — everyone said it was temporary, everyone said it would blow over. It didn't. It reshaped the entire landscape.

## Why YOU Should Care

Even if you're not a die-hard fan — this matters. Sports shapes culture. It shapes conversations at work, at home, with friends. When something this big shifts, you feel it everywhere.

And if you ARE a die-hard fan? Then you already know. You've been thinking about this since it happened.

## The Real Question

**${title}** — what's your gut telling you? Not what the experts say, not what the commentators predict. What does your cricket-watching, pattern-recognizing brain think?

*Drop your prediction below. Let's see if the crowd is smarter than the pundits.*`;

  if (category === "tech") return `## Let's Cut Through the Hype

Every tech cycle has its "this changes everything" moment. Most of them don't. But **${trend}**? This one's different, and I'll tell you why.

I've been watching this space for a while now, and the pattern is clear: the technologies that actually change your life don't announce themselves with a press conference. They sneak up on you. One day you're living without it, the next day you can't imagine life without it.

**${title}** — let me walk you through why this scenario is closer to reality than most people think.

## What's Actually Happening Under the Hood

Forget the headlines. Here's what the people building this stuff are actually saying (when the cameras are off):

- **The infrastructure is already there.** Unlike previous hype cycles, the foundation for ${trend} isn't theoretical. It's deployed, it's scaling, and it's cheaper than expected.
- **The talent migration is real.** The best engineers in the world are moving toward this. When smart people vote with their careers, pay attention.
- **The incumbents are scared.** You can tell by their reactions. When ${related} start making "defensive" announcements, that's how you know the disruption is real.

## How This Hits Your Daily Life

This isn't just a Silicon Valley story. If **${title.replace("What if ", "").replace("?", "")}**, here's what changes for regular people:

- **Your phone experience changes.** The apps you use daily will either adapt or die.
- **Your job description evolves.** Not disappears — evolves. The people who get ahead are the ones who learn the new tools first.
- **Your kids' education needs an update.** Whatever they're learning in school about this topic is already outdated.

## The Bull Case vs. The Bear Case

**Bull:** This is the next internet. We're in 1995 and most people don't see it yet. Early adopters win big.

**Bear:** This is the next blockchain. Lots of noise, real but limited use cases, and 90% of the hype evaporates in 2 years.

The truth? Probably somewhere in between. But "somewhere in between" can still be world-changing.

*What's your take? Vote below.*`;

  if (category === "economy") return `## Okay, Let Me Break This Down Simply

**${trend}** is all over the news, and if you're like most people, you're wondering: "How does this actually affect ME?" Not the markets. Not the billionaires. YOU — your savings, your EMI, your job prospects.

Let's talk about it like humans, not economists.

## The Simple Version

Here's what's happening: ${trend} is creating a ripple effect. Think of it like dropping a stone in a pond. The first ripple hits the obvious stuff — stock prices, currency rates, the stuff you see on business channels. But the ripples keep spreading.

**${title}** — this isn't fear-mongering. This is scenario planning. The smartest investors aren't the ones who predict the future perfectly. They're the ones who've thought through the possibilities BEFORE they happen.

## What This Means for Your Money

Let me be real with you:

- **Your savings account** — ${related} will directly impact interest rates. That 6% FD your parents keep recommending? The math might change.
- **Your job market** — Companies in affected sectors will either hire aggressively or freeze. Knowing which way this goes is worth a lot.
- **Your daily expenses** — If ${trend} plays out the way some analysts think, you'll feel it at the grocery store within 3-6 months.

## The Two Futures

**Future A:** Things stabilize. The headlines fade, markets recover, and we all go back to normal. Life continues, maybe with minor adjustments.

**Future B:** This is the beginning of a structural shift. The old rules don't apply. The people who adapted early? They're fine. The rest? They're scrambling.

The annoying truth is that both futures are possible right now. The data supports both narratives.

## What Smart People Are Doing Right Now

Not panicking. Not ignoring it. They're:
- Diversifying (boring but effective)
- Upskilling (always a good idea when things shift)
- Watching the signals (and ${related} are the signals to watch)

## Your Call

**${title}** — it's not just an intellectual exercise. Your answer reflects your read on the world economy right now. And collectively, our predictions might be more accurate than any single analyst.

*What do you think? Vote below.*`;

  // Default article body
  return `## Here's What Everyone's Missing

**${trend}** is trending for a reason — but the conversation is stuck on the surface. Everyone's reacting, nobody's thinking two steps ahead. So let's do that.

**${title}** — I know it sounds like a thought experiment, but the best thought experiments are the ones that come true when nobody's ready.

## The Setup

Right now, the situation around ${trend} is at an inflection point. The decisions being made this week, the reactions playing out on social media, the policy moves happening behind closed doors — they're all setting the stage. And ${related} are adding fuel.

Most people see a headline and move on. But headlines are symptoms. What matters is the underlying dynamic, and that dynamic is shifting faster than the news cycle can keep up.

## What Changes If This Plays Out

Let's trace it through:

- **First 48 hours:** Chaos. Reactions, hot takes, people talking over each other. The noise-to-signal ratio goes through the roof.
- **First week:** The real stakeholders make their moves. This is where it gets interesting — not what they SAY, but what they DO.
- **First month:** The dust settles into a new pattern. And that new pattern? It looks nothing like what anyone predicted in the first 48 hours.
- **Six months out:** People have already forgotten the original headline. But the changes it triggered? Those are permanent.

## Why I Think This Matters More Than People Realize

Here's the thing about big shifts — they're obvious in hindsight. Right now, ${trend} feels like "just another trending topic." But so did every paradigm shift before it became obvious.

The people who gain the most aren't the ones who react fastest. They're the ones who think furthest ahead.

## Your Move

**${title}** — what does your instinct say? Sometimes the crowd knows things that experts don't. That's literally the principle behind prediction markets.

*Cast your prediction below. Let's see what this community thinks.*`;
}

function generateAnalysisBody(title: string, trend: string, category: string, relatedQueries: string[]): string {
  const related = relatedQueries.slice(0, 3).join(", ") || "connected factors";

  return `## Deep Dive: What The Numbers Are Telling Us

This isn't speculation for the sake of it. **${trend}** has real data behind it, and when you lay it all out, the scenario in **${title}** starts looking less like fiction and more like forecasting.

Let's go deep.

## The Signal Through The Noise

Everyone's talking about ${trend}. Social media is on fire. But here's what actually matters — not the opinions, the indicators:

- **Momentum:** The trending volume isn't just high — it's accelerating. That's a leading indicator, not a lagging one.
- **Connected signals:** ${related} aren't trending by coincidence. When multiple related topics spike simultaneously, it means the underlying story is bigger than any single headline.
- **Historical precedent:** We've seen this pattern before. And every time, the "extreme scenario" was closer to reality than the "moderate" one.

## Scenario Modeling

### Outcome A: The Optimistic Path
${trend} peaks and resolves. Short-term disruption, long-term nothing-burger. The system absorbs the shock, adapts, and moves on. Probability: moderate, but lower than most people assume.

### Outcome B: The Realistic Path
Significant changes over 3-6 months. Not the end of the world, but a genuine reshuffling. Winners and losers emerge. The landscape looks meaningfully different by year-end. Probability: this is where most of the evidence points.

### Outcome C: The Black Swan Path
Everything goes sideways in ways nobody predicted. ${title.replace("What if ", "").replace("?", "")} isn't just possible — it's the central event of the year. Probability: low, but the impact is so high that ignoring it is irresponsible.

## What To Watch This Week

These are your leading indicators. If these move, the scenario accelerates:

1. **Official statements** — Not the prepared ones. Watch for off-script moments, body language, sudden silence.
2. **Money flows** — Follow the capital. Smart money moves before headlines catch up.
3. **${related}** — These connected signals will tell you which scenario is winning.

## The Bottom Line

**${title}** isn't the question you should be asking with skepticism. It's the question you should be preparing for.

The evidence doesn't demand certainty. But it demands attention.

*What's your assessment? Cast your prediction.*`;
}

function generateCaseStudyBody(title: string, trend: string, category: string, relatedQueries: string[]): string {
  const related = relatedQueries.slice(0, 2).join(" and ") || "similar patterns";

  return `## We've Seen This Movie Before

Sit down, because I'm about to show you something that'll either make you very confident or very nervous. **${trend}** isn't new. The specifics are new, sure. But the PATTERN? We've literally seen this play out before.

## The Uncomfortable Parallel

Every generation thinks their situation is unprecedented. "This time is different." It almost never is. The names change, the technology changes, the scale changes — but human behavior? That's the constant.

When ${related} started gaining traction, the same conversations happened. The same debates. The same people saying "this will blow over" and the same people saying "this changes everything."

You know what happened? The "this changes everything" crowd was right. Not immediately — these things take time. But when the dust settled, the world looked different.

## The Key Difference This Time

Here's where it gets interesting. The pattern is the same, but one critical variable has changed: **speed**.

What used to take months now takes days. Information travels instantly. Markets react in milliseconds. Public opinion can shift overnight thanks to one viral post.

So when I say **${title}**, I'm not being dramatic. I'm saying: take the historical parallel, compress the timeline by 10x, and that's what we might be looking at.

## What Happened Last Time (The Short Version)

- **Phase 1:** Everyone noticed, nobody acted. "Let's wait and see."
- **Phase 2:** Early movers made their bets. Everyone else called them crazy.
- **Phase 3:** The shift became undeniable. Suddenly everyone was scrambling.
- **Phase 4:** New normal established. The early movers looked like geniuses.

Sound familiar? Because we're somewhere between Phase 1 and Phase 2 right now with ${trend}.

## The Lesson That Keeps Not Being Learned

**The biggest risk isn't being wrong about the extreme scenario. It's being complacent about the status quo.**

Every time — EVERY time — the people who lost the most weren't the ones who bet wrong. They were the ones who didn't bet at all. Who assumed things would continue as they were.

## So Where Do You Stand?

**${title}** — armed with the historical parallel, what's your read? Are we repeating history, or is this genuinely different?

*Vote below. The pattern says one thing. Let's see if the crowd agrees.*`;
}

function generatePredictionBody(title: string, trend: string, _category: string, relatedQueries: string[]): string {
  const related = relatedQueries.slice(0, 3).join(", ") || "key factors";

  return `## Alright, Let's Settle This

**${title}**

Everyone has an opinion. Your group chat has been debating this. Twitter is split. The "experts" disagree with each other. So let's do something about it — let's actually predict what happens and see who's right.

## Why This Prediction Matters Right Now

Timing is everything. Ask this question too early, it's pure speculation. Ask it too late, it's hindsight. But right now? **${trend}** is at the exact inflection point where the outcome could genuinely go either way.

The signals are mixed:
- ${related} suggest momentum in one direction
- But there are credible counter-arguments that can't be ignored
- The uncertainty is what makes this prediction valuable

## The Stakes (Yes, Even For You)

"Why should I care about some prediction poll?" Because this isn't abstract:

- If the bullish outcome wins, early believers look smart and late doubters scramble
- If the bearish outcome wins, the cautious ones were right all along
- Either way, your prediction right now is a snapshot of your thinking — and in a few weeks, you'll know if your instincts were right

## The Rules

This is a collective intelligence experiment. No one person knows the answer. But when hundreds of people with different perspectives, different information, and different instincts vote — the aggregate prediction is often shockingly accurate.

That's not mysticism. That's math. It's the same principle that makes prediction markets work.

## Make Your Call

Look at the outcomes below. Don't overthink it. What does your gut say? What does your experience tell you? What would you bet on if you had to?

*Cast your prediction. The crowd's wisdom is only as good as your participation.*`;
}

// ── Title templates — relatable, not corporate ──

interface TitleTemplate { title: string; description: string; }

const ARTICLE_TITLES: Record<string, TitleTemplate[]> = {
  politics: [
    { title: "What if {title} actually changes the political landscape?", description: "The scenario nobody in power wants to think about — but everyone else should." },
    { title: "What if {title} is the beginning of something bigger?", description: "When a trending political moment becomes a turning point, here's what unfolds." },
    { title: "What if {title} forces leaders to pick a side?", description: "The pressure is building. This analysis explores what happens when the dam breaks." },
  ],
  economy: [
    { title: "What if {title} hits your wallet harder than you think?", description: "Forget the stock tickers — here's how this actually affects your daily life." },
    { title: "What if {title} is the opportunity everyone's ignoring?", description: "While others panic, the smart money sees something different. Here's why." },
    { title: "What if {title} triggers the next big market move?", description: "The ripple effects are already starting. A scenario breakdown for real people." },
  ],
  tech: [
    { title: "What if {title} makes everything we know obsolete?", description: "The tech disruption that's closer than you think — and what it means for you." },
    { title: "What if {title} is the real AI moment (not the hype)?", description: "Cutting through the noise to find the signal. This could actually matter." },
    { title: "What if {title} changes the internet as we know it?", description: "Not clickbait — a genuine scenario analysis of where this tech trend leads." },
  ],
  sports: [
    { title: "What if {title} rewrites the record books?", description: "The sporting scenario that every fan is secretly thinking about. Let's go there." },
    { title: "What if {title} is the moment this season is remembered for?", description: "Every season has THAT moment. Are we watching it unfold right now?" },
    { title: "What if {title} creates the biggest dynasty or the biggest upset?", description: "The storyline that could define a generation of fans. Breaking it down." },
  ],
  entertainment: [
    { title: "What if {title} breaks the internet (for real this time)?", description: "Not just trending — potentially culture-shifting. Here's the scenario." },
    { title: "What if {title} starts a whole new era in entertainment?", description: "When pop culture moments become inflection points. An analysis." },
  ],
  society: [
    { title: "What if {title} changes how your kids grow up?", description: "The societal shift that sounds far away but might already be here." },
    { title: "What if {title} is the wake-up call we needed?", description: "Sometimes trending topics are symptoms of deeper change. This one might be." },
  ],
  general: [
    { title: "What if {title} is bigger than anyone realizes?", description: "The trending topic that could be a footnote — or a turning point. Let's find out." },
    { title: "What if everyone's wrong about {title}?", description: "Contrarian take: the conventional wisdom might be completely backwards." },
    { title: "What if {title} is just the beginning?", description: "When trending moments are the first domino in a much bigger chain." },
  ],
};

// ── Outcome sets — more specific and relatable ──

const OUTCOME_SETS: Record<string, { label: string; description: string }[][]> = {
  politics: [[
    { label: "Complete game-changer", description: "This reshapes the political map" },
    { label: "Significant but contained", description: "Big noise but the system absorbs it" },
    { label: "All talk, no change", description: "Headlines fade, status quo wins" },
  ]],
  economy: [[
    { label: "Your costs go up", description: "Prices, rates, or taxes increase noticeably" },
    { label: "New opportunities emerge", description: "Smart money finds ways to profit" },
    { label: "Markets shrug it off", description: "Brief volatility then back to normal" },
  ]],
  tech: [[
    { label: "This changes everything", description: "We look back at this as a before/after moment" },
    { label: "Cool but overhyped", description: "Real impact but not as big as Twitter thinks" },
    { label: "Dead in 2 years", description: "The hype cycle wins again" },
  ]],
  sports: [[
    { label: "Legend is born", description: "This becomes a highlight reel moment forever" },
    { label: "Great story, normal outcome", description: "Exciting but doesn't change the standings" },
    { label: "Total upset", description: "Nobody — NOBODY — saw this coming" },
    { label: "Controversy takes over", description: "The drama overshadows the sport itself" },
  ]],
  entertainment: [[
    { label: "Cultural moment", description: "People reference this for years" },
    { label: "Viral then forgotten", description: "3 days of memes then gone" },
    { label: "Industry shift", description: "How entertainment is made/consumed changes" },
  ]],
  default: [[
    { label: "Bigger than we think", description: "History proves the optimists right" },
    { label: "Exactly as expected", description: "No surprises, predictable outcome" },
    { label: "Fizzles out quietly", description: "The world moves on faster than expected" },
    { label: "Wild card nobody predicted", description: "Something completely unexpected happens" },
  ]],
};

// ── Main generator ──

export function generateScenarios(trends: TrendInput[], country: string = "in"): GeneratedScenario[] {
  const scenarios: GeneratedScenario[] = [];

  for (let i = 0; i < trends.length; i++) {
    const trend = trends[i];
    const category = detectCategory(trend);
    const contentType = CONTENT_TYPES[i % CONTENT_TYPES.length];

    const catTitles = ARTICLE_TITLES[category] || ARTICLE_TITLES.general;
    const allTitles = [...catTitles, ...ARTICLE_TITLES.general];
    const tmpl = allTitles[Math.floor(Math.random() * allTitles.length)];

    const title = tmpl.title.replace(/\{title\}/g, trend.title);
    const description = tmpl.description;

    let body: string;
    switch (contentType) {
      case "analysis":
        body = generateAnalysisBody(title, trend.title, category, trend.relatedQueries);
        break;
      case "case_study":
        body = generateCaseStudyBody(title, trend.title, category, trend.relatedQueries);
        break;
      case "prediction":
        body = generatePredictionBody(title, trend.title, category, trend.relatedQueries);
        break;
      default:
        body = generateArticleBody(title, trend.title, category, trend.relatedQueries);
    }

    const outcomes = (OUTCOME_SETS[category] || OUTCOME_SETS.default)[0];
    const readTime = contentType === "prediction" ? 2 : contentType === "analysis" ? 5 : 3;

    scenarios.push({
      title,
      description,
      body,
      content_type: contentType,
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
