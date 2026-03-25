import type { Theory, TrendInput, Mood, SectionBuilder, OutcomeSet } from "./types";

// ── Utility: deterministic word picker ──────────────────────────────────────
// Hashes the trend title to pick a stable word from the mood's temperature array.
// Offset shifts which word is picked so consecutive calls get variety.

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickWord(mood: Mood, trend: TrendInput, offset: number = 0): string {
  const words = mood.wordTemperature;
  const idx = (hashCode(trend.title) + offset) % words.length;
  return words[idx];
}

function topQueries(trend: TrendInput, count: number = 2): string {
  return trend.relatedQueries.slice(0, count).join(", ");
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. GAME THEORY
//    Voice: strategist DM — insider intel, staccato punches, alpha energy
// ═══════════════════════════════════════════════════════════════════════════════

const gameTheory_openingMove: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## The Opening Move

Here's what nobody's talking about yet.

**${trend.title}** isn't news. It's a move. A calculated, deliberate move.

${temp.charAt(0).toUpperCase() + temp.slice(1)}. That's the only word for it.

The traffic alone tells you — ${trend.traffic} searches. That's not curiosity. That's positioning. Everyone from ${topQueries(trend)} is already in the game. The question is whether you see the board.`;
};

const gameTheory_theBoard: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## The Board

Let's map the players.

On one side: the ones who started **${trend.title}**. They moved first. First-mover advantage is real — but it also means you showed your hand.

On the other side: everyone watching. ${topQueries(trend, 3)} — these aren't random searches. They're reconnaissance. Each one a player sizing up the field.

The board is ${temp}. And the stakes? Higher than they look.

Every player has two choices: cooperate or defect. The math is cold.`;
};

const gameTheory_hiddenPlay: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The Hidden Play

Now here's where it gets interesting.

The obvious play? Everyone sees that. It's priced in. The smart money is watching something else entirely.

**${trend.relatedQueries[0] || trend.title}** — that's the decoy. While everyone debates that, the real play is happening three moves ahead. ${temp.charAt(0).toUpperCase() + temp.slice(1)}.

I'm letting you in on something: the player who wins this isn't the loudest one. It's the one who understood the incentive structure before anyone else.`;
};

const gameTheory_forcedHand: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 3);
  return `## The Forced Hand

Here's the part nobody wants to admit.

Someone's hand is getting forced. When **${trend.title}** hit ${trend.traffic} searches, the pressure became ${temp}. You can't stay silent at that volume. Silence is a position. Inaction is a strategy.

The clock is ticking.

Either you move, or the game moves you.`;
};

const gameTheory_endgame: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 4);
  return `## The Endgame

So where does this end?

Three outcomes. Maybe four. But only one of them is ${temp}.

**${trend.title}** resolves when one player finally breaks the equilibrium. Not through force — through information. The side that knows more, acts less, and waits longer... wins.

That's always been the game.

The only question left: are you playing, or are you being played?`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. BUTTERFLY EFFECT
//    Voice: storyteller pulling a thread — rolling, flowing, "and then..." energy
// ═══════════════════════════════════════════════════════════════════════════════

const butterfly_theSmallThing: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## The Small Thing

It started with something so small you almost missed it.

**${trend.title}** — on any other day, you scroll past it. A headline among headlines, a ripple in the feed. But this particular ripple had weight to it, the kind that doesn't dissipate, and somewhere in the churn of ${topQueries(trend)}, something shifted.

Not dramatically. Not yet. Just a thread pulling loose from the fabric of things, the way threads do when the weave is already ${temp}. And once a thread starts pulling, well — you know how this goes. You follow it. You have to. Because the small thing is never really the small thing, is it? It's the thing that was already waiting to happen, and **${trend.title}** just gave it permission.`;
};

const butterfly_theChain: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## The Chain

And then the chain began.

From **${trend.title}**, the signal moved — not in a straight line, nothing this interesting ever moves in straight lines — but outward, the way a crack spreads through glass when you hit it just right. First into ${trend.relatedQueries[0] || "adjacent conversations"}, which nobody had connected to this story until suddenly the connection was obvious, almost embarrassingly so.

And from there into ${trend.relatedQueries[1] || "territories nobody predicted"}, where ${trend.traffic} searches became not just a number but a pressure wave, ${temp} in its intensity, reshaping the landscape of who cares about what and why.

Each link in the chain made the next one inevitable. That's the terrifying beauty of cascades — by the time you see the pattern, the pattern has already seen you.`;
};

const butterfly_theFullPicture: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The Full Picture

Step back far enough and the full picture emerges, ${temp} and undeniable.

What started as **${trend.title}** — that small, almost forgettable thing — has drawn a line through ${topQueries(trend, 3)} and beyond, connecting dots that didn't know they were on the same page. The butterfly flapped its wings, and somewhere on the other side of this story, the weather changed.

This is what cascades do. They don't ask permission. They don't follow the script. They take a single tremor and turn it into a landscape, and by the time you map the full chain from first cause to final consequence, you realize: the world after **${trend.title}** is not the same world as before. The thread pulled all the way through, and what unraveled was bigger than anyone standing at the beginning could have imagined.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. DUNNING-KRUGER
//    Voice: roaster with receipts — conversational, questions to reader, sharp
// ═══════════════════════════════════════════════════════════════════════════════

const dk_thePopularTake: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## The Popular Take

You've seen this take, right?

Scroll through any feed right now and you'll find it — the ${temp} consensus on **${trend.title}**. Everyone's an expert. Your uncle who barely uses the internet has opinions. The reply guys are out in force. And the takes? Oh, the takes are *confident*.

"Obviously it's about ${trend.relatedQueries[0] || "the usual suspects"}." "Anyone with half a brain can see that ${trend.relatedQueries[1] || "this was inevitable"}." ${trend.traffic} searches, and approximately 90% of those people are absolutely certain they understand what's happening.

Here's the thing about confidence: it's not correlated with accuracy. Like, at all.`;
};

const dk_whyItFeelsRight: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## Why It Feels Right

And look — I'm not judging. The popular take on **${trend.title}** *feels* right. That's the whole problem.

It feels right because it's simple. Because it confirms what you already believed. Because ${topQueries(trend)} all seem to point in the same direction, and when everything points one way, your brain goes: "See? I knew it."

That feeling? That ${temp} certainty? That's not insight. That's pattern-matching running on vibes. Your brain is a prediction machine, and it would rather be fast than accurate. So it grabs the nearest narrative, stamps "CORRECT" on it, and moves on.

You've done this before. We all have. The question is whether you catch yourself doing it *this* time.`;
};

const dk_theData: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The Data

Now let's look at what's actually there.

**${trend.title}** generated ${trend.traffic} searches. That's the fact. Everything after that is interpretation, and interpretation is where things get ${temp}.

The related queries — ${topQueries(trend, 3)} — tell a different story than the viral takes suggest. They tell a story of people who are *searching*, not *finding*. People who don't have answers yet. The gap between what's trending and what's understood is a canyon, and the confident takes are building bridges out of assumptions.

The data doesn't care about your priors. It just sits there, being inconvenient.`;
};

const dk_theExpertReality: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 3);
  return `## The Expert Reality

So what do the people who actually study this stuff think?

They think it's ${temp}. They think it's complicated. They think the hot takes are missing about four layers of context that you'd need a decade of domain knowledge to see.

The expert view on **${trend.title}** isn't sexy. It doesn't fit in a tweet. It starts with "well, it depends" and ends with caveats. Nobody's going viral with nuance.

But here's the uncomfortable truth: the nuanced take is almost always closer to reality. The confident takes filling your feed about ${topQueries(trend)}? Most of them will age like milk. The expert take will age like the boring, accurate thing it always was.

I'm not saying you're wrong. I'm saying the odds aren't in your favor.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. STREISAND EFFECT
//    Voice: live-tweeting a disaster — accelerating, breathless, shared disbelief
// ═══════════════════════════════════════════════════════════════════════════════

const streisand_theOriginal: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## The Original

OK so let me set the scene.

**${trend.title}** was just... a thing. A normal, unremarkable thing. The kind of story that gets maybe a few hundred clicks, maybe a brief mention in ${trend.relatedQueries[0] || "the usual outlets"}, and then everyone moves on with their lives.

It was ${temp}. It was contained. It was, by every reasonable measure, not a big deal.

If someone had just left it alone — just let the news cycle do what news cycles do — you wouldn't be reading this right now. But someone didn't leave it alone. Someone looked at this perfectly manageable situation and thought: "I should try to make this disappear."

And that's when everything changed.`;
};

const streisand_theSuppression: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## The Suppression

They tried to kill it. They actually tried to kill it.

The details around **${trend.title}** started getting scrubbed, buried, pushed down. The response was ${temp} and immediate. Suddenly ${topQueries(trend)} became harder to find. Certain links stopped working. Certain accounts went quiet.

You're watching this with me. You see what's happening, right?

The moment they moved to suppress it, they proved it mattered.`;
};

const streisand_theExplosion: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The Explosion

And then — ${temp} — it blew up.

${trend.traffic} searches. That number? That's not organic curiosity. That's the Streisand Effect in full bloom. Every attempt to hide **${trend.title}** became the story. The cover-up *became* the content.

${topQueries(trend)} — all of it trending now. All of it because someone tried to make it stop.

You cannot un-ring this bell.`;
};

const streisand_theIrony: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 3);
  return `## The Irony

${temp.charAt(0).toUpperCase() + temp.slice(1)}.

The thing they tried to hide about **${trend.title}**? Now it's everywhere. More people know about it *because* of the suppression than ever would have seen the original.

The internet remembers. The internet always remembers.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. PARETO PRINCIPLE
//    Voice: mentor cutting through noise — calm, sharp, measured, no wasted words
// ═══════════════════════════════════════════════════════════════════════════════

const pareto_theNoise: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## The Noise

Stop scrolling. I need your attention for exactly three minutes.

**${trend.title}** has generated ${trend.traffic} searches. Thousands of takes. Millions of words. The discourse around ${topQueries(trend)} is ${temp} and growing. Everyone's talking. Very few are saying anything.

Here's what most analysis won't tell you: 80% of everything you've read about this is noise. Commentary on commentary. Reaction to reaction. People performing understanding rather than demonstrating it.

You don't need more information. You need less — but better.`;
};

const pareto_theFunnel: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## The Funnel

Strip it down.

Of everything swirling around **${trend.title}**, only a handful of factors actually matter. The rest is decoration. ${temp.charAt(0).toUpperCase() + temp.slice(1)}, but decoration.

The core drivers: the thing that started it, the players who can actually move the outcome, and the single constraint everyone's ignoring. That's it. ${topQueries(trend)} — most of that is downstream. Consequence, not cause.

Focus tightens. Sentences shorten. Here's the lever.`;
};

const pareto_theLever: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The Lever

One thing decides how **${trend.title}** ends. One.

Not the ${trend.traffic} searches. Not the hot takes. Not ${trend.relatedQueries[0] || "the side debates"}. One lever. One decision point. And it's ${temp}.

Find the 20% that drives 80% of the outcome. Ignore the rest. That's not laziness. That's clarity.

Now you know where to look. Stop reading. Start watching.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRY
// ═══════════════════════════════════════════════════════════════════════════════

const THEORIES: Theory[] = [
  {
    id: "game_theory",
    name: "Game Theory",
    group: "economics_strategy",
    voice:
      "strategist DM — like someone sliding into your DMs with insider intel",
    rhythm:
      "staccato, short punchy. Paragraph breaks are weapons. One-liners hit hard.",
    readerRelationship:
      "I'm letting you in on something. You feel like you're getting alpha.",
    sections: [
      gameTheory_openingMove,
      gameTheory_theBoard,
      gameTheory_hiddenPlay,
      gameTheory_forcedHand,
      gameTheory_endgame,
    ],
    outcomes: [
      [
        { label: "The Checkmate", description: "One player dominates completely — total strategic victory with no counter-play left." },
        { label: "The Nash Equilibrium", description: "All players reach a stable state — nobody can improve by changing strategy alone." },
        { label: "The Bluff That Worked", description: "A risky deception paid off — the player who faked strength won real ground." },
        { label: "Mutual Destruction", description: "Defection by all sides — everyone loses, trust is gone, scorched earth." },
      ],
    ],
    affinities: {
      politics: 0.9,
      economy: 0.85,
      sports: 0.9,
      tech: 0.5,
      entertainment: 0.3,
      society: 0.4,
    },
    keywords: [
      "strategy", "move", "player", "bid", "auction",
      "compete", "rival", "counter", "negotiate", "alliance",
    ],
  },
  {
    id: "butterfly_effect",
    name: "Butterfly Effect",
    group: "economics_strategy",
    voice:
      "storyteller pulling a thread — tracing a thread through a maze, amazed at where it leads",
    rhythm:
      'rolling, flowing. "And then..." energy. Paragraphs flow into each other.',
    readerRelationship:
      "Come with me, I'll show you something. You're on a journey together.",
    sections: [
      butterfly_theSmallThing,
      butterfly_theChain,
      butterfly_theFullPicture,
    ],
    outcomes: [
      [
        { label: "The Full Cascade", description: "Every domino fell — the chain reaction ran its full course, reshaping everything downstream." },
        { label: "The Firebreak", description: "Something stopped the chain — a circuit breaker, a counterforce, a lucky break." },
        { label: "The Bigger Butterfly", description: "A second cascade overtook the first — an even larger force entered the frame." },
        { label: "The Slow Burn", description: "The chain continues, just slower — effects compound over months, not days." },
      ],
    ],
    affinities: {
      society: 0.9,
      economy: 0.85,
      tech: 0.8,
      politics: 0.7,
      sports: 0.4,
      entertainment: 0.5,
    },
    keywords: [
      "cascade", "ripple", "chain", "consequence", "trigger",
      "domino", "spread", "impact", "one small",
    ],
  },
  {
    id: "dunning_kruger",
    name: "Dunning-Kruger",
    group: "psychology_behavior",
    voice:
      "roaster with receipts — your sharpest friend calling out nonsense with data",
    rhythm:
      'conversational. Questions to the reader. "You\'ve seen this take, right?"',
    readerRelationship:
      "I'm not judging you — but let me show you what the experts see.",
    sections: [
      dk_thePopularTake,
      dk_whyItFeelsRight,
      dk_theData,
      dk_theExpertReality,
    ],
    outcomes: [
      [
        { label: "The Experts Were Right", description: "The nuanced, boring take wins — domain knowledge beats viral confidence." },
        { label: "The Uncle Was Right", description: "Against all odds, the hot take nailed it — gut instinct over expertise, this time." },
        { label: "Everyone Was Wrong", description: "Neither the confident masses nor the careful experts saw the real answer." },
        { label: "The Nuance Nobody Wanted", description: "The truth is complicated, unsatisfying, and doesn't fit any narrative cleanly." },
      ],
    ],
    affinities: {
      politics: 0.9,
      tech: 0.8,
      society: 0.85,
      economy: 0.6,
      sports: 0.5,
      entertainment: 0.4,
    },
    keywords: [
      "opinion", "expert", "actually", "wrong", "confident",
      "viral take", "everyone thinks", "hot take", "dunning",
    ],
  },
  {
    id: "streisand_effect",
    name: "Streisand Effect",
    group: "systems_chaos",
    voice:
      "live-tweeting a disaster — narrating a trainwreck in real-time",
    rhythm:
      "accelerating. Each section shorter than the last. Breathless by the end.",
    readerRelationship:
      "You're watching this with me. Shared disbelief.",
    sections: [
      streisand_theOriginal,
      streisand_theSuppression,
      streisand_theExplosion,
      streisand_theIrony,
    ],
    outcomes: [
      [
        { label: "The Full Streisand", description: "The suppression made it 100x bigger — the cover-up became the story." },
        { label: "The Quiet Delete", description: "They got away with it — the removal worked and nobody noticed in time." },
        { label: "The Pivot", description: "Instead of suppressing, they reframed — turning the narrative before it spiraled." },
        { label: "The Lawyers Win", description: "Legal pressure actually worked — the content came down and stayed down." },
      ],
    ],
    affinities: {
      entertainment: 0.9,
      politics: 0.85,
      tech: 0.8,
      society: 0.6,
      economy: 0.3,
      sports: 0.2,
    },
    keywords: [
      "ban", "censor", "remove", "takedown", "suppress",
      "viral", "backfire", "delete", "cover up", "hide",
    ],
  },
  {
    id: "pareto_principle",
    name: "Pareto Principle",
    group: "systems_chaos",
    voice:
      "mentor cutting through noise — calm, sharp, already seen this movie",
    rhythm:
      "measured, confident. No wasted words. Sentences get shorter as focus tightens.",
    readerRelationship:
      "Stop scrolling. Here's the only thing that matters.",
    sections: [
      pareto_theNoise,
      pareto_theFunnel,
      pareto_theLever,
    ],
    outcomes: [
      [
        { label: "The 20% Wins", description: "The core driver dominated — the vital few outweighed the trivial many." },
        { label: "The Long Tail Surprise", description: "The 80% noise turned out to matter — small forces combined into something bigger." },
        { label: "The Wrong 20%", description: "Everyone focused on the wrong lever — the real driver was hiding in plain sight." },
        { label: "Diminishing Returns", description: "Optimization hit a wall — squeezing the lever harder stopped producing results." },
      ],
    ],
    affinities: {
      economy: 0.9,
      tech: 0.85,
      sports: 0.7,
      politics: 0.6,
      society: 0.5,
      entertainment: 0.4,
    },
    keywords: [
      "key", "main", "critical", "most important", "focus",
      "core", "essential", "vital", "primary", "leverage",
    ],
  },
];

export const THEORY_REGISTRY: Map<string, Theory> = new Map(
  THEORIES.map((theory) => [theory.id, theory])
);

export function getTheory(id: string): Theory | undefined {
  return THEORY_REGISTRY.get(id);
}
