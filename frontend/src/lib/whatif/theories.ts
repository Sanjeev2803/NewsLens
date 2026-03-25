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
// 6. DOMINO THEORY
//    Voice: numbered countdown — sequential, building inevitability
// ═══════════════════════════════════════════════════════════════════════════════

const domino_firstDomino: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## Domino #1: The Trigger

The first domino just fell.

**${trend.title}** wasn't supposed to start a chain. Most things don't. But ${trend.traffic} searches later, the floor is vibrating, and the next piece is already leaning.

${temp.charAt(0).toUpperCase() + temp.slice(1)}. That's how the first one felt — ${temp} and contained, almost polite. The way all cascades start before they stop being polite.

Here are the next five dominoes. I'll count them down for you.`;
};

const domino_secondDomino: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## Domino #2: The Immediate Fallout

The second domino is already falling.

${trend.relatedQueries[0] || "The adjacent sector"} — that's domino number two. It was standing six inches from **${trend.title}**, and six inches is nothing when momentum is involved.

This one's ${temp}. You can hear it hit. The people in ${topQueries(trend)} heard it too. They're checking their own dominoes right now, measuring the distance, wondering if they're number three.

They are.`;
};

const domino_thirdAndFourth: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## Dominoes #3 and #4: The Acceleration

Three and four fall almost simultaneously.

That's the thing about domino chains — the gaps shrink. The first two had space between them. Time to react. Time to brace. But three and four? They're ${temp}, back-to-back, overlapping.

${topQueries(trend, 3)} — these aren't separate stories anymore. They're the same story wearing different headlines. The chain is moving faster than the news cycle can label it.

Nobody's setting these up anymore. Gravity is doing the work.`;
};

const domino_fifthDomino: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 3);
  return `## Domino #5: The One That Matters

Domino five is the one everyone's watching.

Not because it's the biggest — because it's the last one anyone can catch. After five, the chain becomes self-sustaining. After five, **${trend.title}** stops being an event and starts being an era.

This domino is ${temp}. It's wobbling. And the hand that could steady it is hesitating, because steadying domino five means admitting dominoes one through four already fell on your watch.

The countdown is almost done.`;
};

const domino_theChainComplete: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 4);
  return `## The Chain Complete

Five dominoes. One direction. Zero reversals.

**${trend.title}** just wrote a sequence that can't be unwritten. Each piece validated the next. Each fall made the following fall ${temp} and inevitable.

The question was never whether the chain would complete. The question was always: what's standing on the other side of domino five?

That thing? It just felt the vibration.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. GREATER FOOL
//    Voice: market insider whispering — hype building to cliff reveal
// ═══════════════════════════════════════════════════════════════════════════════

const greaterFool_theRush: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## The Rush

Everyone's buying. *Everyone*.

**${trend.title}** is the hottest ticket in the room and the room is ${temp} with energy. ${trend.traffic} searches — that's not interest, that's mania. The kind of mania where your neighbor starts explaining the fundamentals to you at a barbecue and you nod along because the number keeps going up.

${topQueries(trend)} — all of it surging. The charts look vertical. The vibes are immaculate. The returns are obscene. And somewhere, quietly, someone who got in early is looking at their phone a lot more than they used to.

But we don't talk about that part yet. Not while the music's playing.`;
};

const greaterFool_theSmartExit: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## The Smart Exit

Let me tell you about the quiet ones.

While the crowd around **${trend.title}** gets louder — ${temp}, euphoric, unstoppable — a different kind of player is moving. Not in. Out. They're not posting about it. They're not celebrating. They're transferring, liquidating, diversifying. Words that don't trend.

The smart money doesn't announce its exit. It just... leaves. And by the time you notice the seat is empty, the person in it has been gone for weeks.

${topQueries(trend)} is still climbing. The volume is still deafening. But if you know where to look, you can see the fingerprints of departure on every surface.

The question is: who's the last buyer?`;
};

const greaterFool_theCliff: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The Cliff

And then — ${temp} — the music stopped.

Not gradually. Not with warning. One moment **${trend.title}** was the future and the next moment it was a lesson. ${trend.traffic} searches pivot from "how to get in" to "what happened" in the span of a news cycle.

The greater fool theory is elegant in its cruelty: every buyer needs a bigger buyer. The chain works perfectly until it doesn't, and when it doesn't, the last person holding the bag looks around the room and realizes everyone else already left.

That barbecue neighbor? He's not returning your texts.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 8. TRAGEDY OF THE COMMONS
//    Voice: systems observer — rational actors creating collective disaster
// ═══════════════════════════════════════════════════════════════════════════════

const commons_playerA: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## Player A: The Rational Actor

Meet Player A. Player A is being perfectly rational about **${trend.title}**.

From where they sit, the math is simple: take what you can, while you can. The resource is there. The incentive is ${temp}. Others are already taking their share — why leave yours on the table?

Player A isn't greedy. Player A is *logical*. Every economics textbook in history would approve of Player A's decision. ${trend.traffic} searches confirm: everyone sees the same opportunity. Everyone is running the same calculus.

Player A sleeps soundly. Player A is making a perfectly rational choice.`;
};

const commons_playerB: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## Player B: The Other Rational Actor

Now meet Player B. Different name, different face, identical logic.

Player B sees **${trend.title}** and thinks the exact same thing Player A thought: this is mine to take. The related activity in ${topQueries(trend)} tells Player B that others are already moving. Hesitation is a cost. Restraint is a tax only the foolish pay.

Player B's reasoning is ${temp} and bulletproof. Individually, unimpeachable. Player B is also being perfectly rational.

Here's the problem: so is Player C. And D. And every other letter in the alphabet.

When everyone is rational, who's watching the commons?`;
};

const commons_theCollision: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The Collision

And here's where all those rational decisions crash into each other.

**${trend.title}** started as abundance. ${trend.traffic} searches fighting over what looked like enough for everyone. But "enough for everyone" assumes not everyone shows up at once. Not everyone takes the maximum. Not everyone is rational in exactly the same ${temp} way.

${topQueries(trend)} — each one a rational actor doing the rational thing, and the sum of all that rationality is a disaster that no individual actor created but all of them built.

The commons is buckling. Not because anyone was wrong. Because everyone was right.`;
};

const commons_theParadox: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 3);
  return `## The Paradox

Everyone was being rational. The result is catastrophe.

That's the tragedy of **${trend.title}** — not that people were selfish, but that they were sensible. Each decision, viewed alone, was the correct one. Stacked together, they're ${temp} and ruinous.

The paradox sits there, ugly and unresolved: the system punishes cooperation and rewards extraction, right up until the moment there's nothing left to extract.

Then it punishes everyone equally.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 9. BANDWAGON EFFECT
//    Voice: trend analyst watching the wave — momentum then exposure
// ═══════════════════════════════════════════════════════════════════════════════

const bandwagon_theWave: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## The Wave

10 million people can't be wrong. Except when they are.

**${trend.title}** has momentum — ${temp}, undeniable momentum. ${trend.traffic} searches. Every feed, every timeline, every group chat. The wave picked this up and the wave doesn't ask questions. The wave just moves.

And it feels good to be on the wave. That's the part nobody wants to examine. When ${topQueries(trend)} are all pointing the same direction, joining isn't just easy — it's *comforting*. You're not following the crowd. You're reading the room. There's a difference, right?

Right?

The wave is the story. Let's see what's underneath it.`;
};

const bandwagon_thePeelBack: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## The Peel-Back

Peel the wave back and look at what started it.

Not the ${trend.traffic} searches. Before that. Before the virality. Before the takes and the threads and the "everyone's talking about" headlines. There was a moment — ${temp} and small — when **${trend.title}** went from "thing that happened" to "thing you must have an opinion about."

That transition? That's not organic. Or at least, it's not *only* organic. Waves need wind. Bandwagons need a first rider. And the gap between "some people care about this" and "everyone cares about this" is smaller and more manufactured than the wave wants you to believe.

${topQueries(trend)} didn't all arrive independently. They arrived because the ones before them arrived.`;
};

const bandwagon_theGap: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The Gap

Here's the gap nobody's measuring: the distance between how many people are *on* the bandwagon and how many people *examined* why they got on.

**${trend.title}** has ${trend.traffic} searchers. Ask each one why they care. You'll get the same three talking points, repeated in slightly different fonts, because the bandwagon doesn't distribute understanding — it distributes ${temp} consensus.

The gap between popularity and validity is where the interesting story lives. Not on the bandwagon. Not off it. In the space between "everyone agrees" and "everyone checked."

That space, for **${trend.title}**, is a canyon.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 10. SUNK COST
//     Voice: sympathetic truth-teller — weight accumulating, trapped
// ═══════════════════════════════════════════════════════════════════════════════

const sunkCost_theInvestment: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## The Investment

They've put in too much to walk away. That's exactly the problem.

**${trend.title}** started as a bet. A reasonable one. The kind of bet that made sense at the time — ${temp}, calculated, eyes-open. Resources went in. Reputation went in. Time went in. The kind of investment that feels like commitment, which it is, and like wisdom, which it might not be.

${trend.traffic} searches are watching this bet play out. ${topQueries(trend)} — all downstream of a decision that was made when the world looked different. The investment was sound. The question is whether the world it was sound *for* still exists.`;
};

const sunkCost_theEscalation: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## The Escalation

And then they doubled down.

Not because the numbers improved. Not because the situation around **${trend.title}** got better. Because the cost of admitting the first investment was wrong felt ${temp} — heavier than the cost of investing more.

That's the escalation trap. Each new dollar, each new day, each new public statement makes the next one more necessary. You're not investing in the outcome anymore. You're investing in the narrative that the previous investment was justified.

${topQueries(trend)} can see it from the outside. From the inside, it just feels like perseverance.`;
};

const sunkCost_theTrap: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The Trap

The trap is fully set now.

**${trend.title}** has consumed enough resources that abandoning it would mean writing off everything that came before. And nobody — not the people with ${trend.traffic} searches of attention on them, not the stakeholders in ${topQueries(trend)} — wants to be the one who says "we should have stopped three steps ago."

The sunk cost is ${temp}. It has its own gravity now, pulling future decisions into orbit around past ones. Every new choice is being made by the ghost of an old choice.

That's the trap: the past is holding the future hostage.`;
};

const sunkCost_theChoice: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 3);
  return `## The Choice

So here it is. The only question that matters.

Can they walk away from **${trend.title}**? Not "should they" — everyone watching from the outside knows the answer to that. Can they? Can they absorb the loss, face the ${temp} reality of what's already spent, and make the next decision based on what's ahead instead of what's behind?

The sunk cost fallacy isn't about money. It's about identity. Walking away means admitting you were wrong. Staying means the cost keeps sinking.

The choice is here. The clock is running. And every minute of hesitation is another coin in the well.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 11. CONFIRMATION BIAS
//     Voice: devil's advocate — dual perspective with hidden third angle
// ═══════════════════════════════════════════════════════════════════════════════

const confirmation_sideA: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## Side A

Both sides are sure they're right. Both are looking at the same data.

Let's start with Side A. Their read on **${trend.title}** is ${temp} and confident: this confirms what they've been saying all along. The ${trend.traffic} searches? Proof. The activity around ${trend.relatedQueries[0] || "related topics"}? More proof. Every data point that fits the narrative gets highlighted, amplified, screenshot'd.

Side A isn't lying. The evidence they're pointing to is real. It exists. You can verify it. Their interpretation is internally consistent and externally persuasive.

Side A has a strong case. Write that down. Now flip the page.`;
};

const confirmation_sideB: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## Side B

Side B looked at **${trend.title}** and saw the exact opposite.

Same ${trend.traffic} searches. Same headlines. Same raw data. Completely different conclusion — ${temp} and equally confident. Where Side A saw confirmation, Side B saw warning. Where Side A highlighted ${trend.relatedQueries[0] || "one set of facts"}, Side B highlighted ${trend.relatedQueries[1] || "a different set entirely"}.

Side B isn't lying either. Their evidence is also real. Also verifiable. Also internally consistent.

Two confident readings. One reality. The math doesn't work unless someone's filtering.

Spoiler: they both are.`;
};

const confirmation_theMissing: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The Missing Piece

Here's what neither side mentioned.

While Side A and Side B argued over **${trend.title}**, both of them walked past the same piece of evidence. Not because it was hidden — it's right there in ${topQueries(trend)} — but because it didn't fit either narrative. It was ${temp} and inconvenient, the kind of data point that makes you say "huh" instead of "see?"

Confirmation bias isn't about seeing things that aren't there. It's about not seeing things that are. Both sides built airtight cases by leaving the same window open.

The missing piece doesn't support Side A. It doesn't support Side B. It just sits there, being true, waiting for someone to pick it up.`;
};

const confirmation_theThirdAngle: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 3);
  return `## The Third Angle

What if both sides are wrong?

Not wrong about the facts — wrong about the frame. **${trend.title}** might not be the story Side A thinks it is *or* the story Side B insists on. The third angle is ${temp}: what if the real story is why we split into sides at all?

${trend.traffic} searches. Half went left, half went right, and nobody went up — nobody zoomed out far enough to see that the disagreement itself is the data point.

The bias isn't in the conclusion. It's in the question. Change the question, and **${trend.title}** tells a story neither side bothered to read.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 12. HERD MENTALITY
//     Voice: aerial observer watching the stampede — tracking from above
// ═══════════════════════════════════════════════════════════════════════════════

const herd_theStampede: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## The Stampede

The crowd is moving fast. Nobody's asking where.

From up here — above the noise of **${trend.title}**, above the ${trend.traffic} searches, above the ${temp} churn of ${topQueries(trend)} — the pattern is unmistakable. It's a stampede. Not a march, not a migration, a stampede. The difference? A march has a map. A stampede has momentum.

Watch the bodies move. The ones in front aren't leading — they're just in front. The ones in back aren't following — they're being pushed. And the ones in the middle? They can't see anything at all. They just feel the pressure on every side and move with it.

That's **${trend.title}** right now. ${temp.charAt(0).toUpperCase() + temp.slice(1)} motion. Zero navigation.`;
};

const herd_theEdge: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## The Edge

Now look at the edges of the herd.

Every stampede has edges — the places where the crowd thins out, where individuals can still turn their heads, where the pressure drops just enough to think. The edges of **${trend.title}** are ${temp} and telling.

Out here, people are asking different questions. Not "what does everyone think?" but "why does everyone think that?" Not joining ${topQueries(trend)} reflexively but reading the signals with something the center of the herd can't afford: space.

The edge-runners see what the herd can't. They see the terrain ahead. They see whether this stampede is running toward water or toward a drop.

The herd doesn't care about edge-runners. The herd has mass.`;
};

const herd_theAerial: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The Aerial View

Pull all the way up. Maximum altitude. What do you see?

You see **${trend.title}** as a shape — ${temp}, sprawling, moving as one organism made of millions of individual decisions that feel individual and aren't. The ${trend.traffic} searches form a river from this height, and rivers don't negotiate with rocks. They go around or they go over.

From up here, the destination is visible. The herd can't see it — the herd is inside itself. But you can see it now. The terrain ahead. The obstacles. The fork that's coming where the stampede either channels into something productive or disperses into nothing.

The crowd is still moving fast. Now you know where.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 13. BLACK SWAN
//     Voice: post-mortem analyst — model vs reality, then the lesson
// ═══════════════════════════════════════════════════════════════════════════════

const blackSwan_theModel: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## The Model

Nobody had this in their model. That's the point.

Before **${trend.title}**, every forecast, every prediction, every ${temp} projection assumed a world where this didn't happen. And why wouldn't they? Models are built on precedent, and there was no precedent for this.

The analysts had their spreadsheets. The pundits had their patterns. ${topQueries(trend)} wasn't on anyone's radar because radars are calibrated to detect what's happened before, and this hadn't happened before.

The model was clean. The model was confident. The model was a map of yesterday being sold as a map of tomorrow. And then **${trend.title}** walked in, and the model met reality.`;
};

const blackSwan_theReality: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## The Reality

${trend.traffic} searches. That's the sound of a model breaking.

**${trend.title}** didn't care about the forecast. It showed up ${temp} and uninvited, carrying implications that no sensitivity analysis had stress-tested because you can't stress-test for "thing we didn't imagine."

${topQueries(trend)} — all of it recalibrating in real time. Watch the language shift: "unprecedented" (meaning: not in my spreadsheet), "unforeseen" (meaning: I wasn't looking), "black swan" (meaning: don't blame me, blame the universe).

The reality diverged from the model at exactly the moment the model mattered most. That's not a bug. That's what models do when the world stops rhyming with the past.`;
};

const blackSwan_theLessonInHindsight: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The Lesson in Hindsight

And now, with ${temp} certainty, the hindsight experts arrive.

"We should have seen it." "The signs were there." "If you look at ${topQueries(trend)}, it was obvious." The post-mortem is always confident. The pre-mortem never is.

**${trend.title}** will be studied. Papers will be written. The next model will include a variable for this exact scenario, which guarantees the next black swan will be a different one entirely. That's the lesson nobody learns: you can't prevent black swans by cataloging the last one.

The real lesson is ${temp} and uncomfortable — the model will always be incomplete, the forecast will always miss the thing that matters most, and the only honest prediction is "something will happen that we didn't predict."

Nobody puts that in a report.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 14. CHAOS THEORY
//     Voice: simulation runner — variable sensitivity, diverging outcomes
// ═══════════════════════════════════════════════════════════════════════════════

const chaos_theVariables: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## The Variables

Run this scenario 100 times. You get 100 different outcomes.

**${trend.title}** has at least twelve moving parts, and I'm being generous by counting only twelve. ${topQueries(trend)} — each one a variable. ${trend.traffic} searches — another variable. The timing, the context, the mood of the room — all variables. All ${temp}. All interacting.

In a simple system, you change one input and the output shifts proportionally. This isn't a simple system. This is a system where changing one input by 2% changes the output by 200%, and the relationship between the two is a function that nobody has the equation for.

Let me map the variables. Then let me show you what happens when we touch just one.`;
};

const chaos_theSensitivity: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## The Sensitivity

Here's where it gets ${temp}.

Take **${trend.title}** and change one thing. One small thing — the timing, the first response, the platform it broke on, the day of the week. Something trivial. Something a forecaster would round to zero.

Now run the simulation. The outcome isn't slightly different. It's *wildly* different. ${topQueries(trend)} goes from trending to forgotten. The ${trend.traffic} searches become 500. Or 50 million. The trajectory forks at the exact point where the change was smallest.

That's sensitivity to initial conditions. The system doesn't care that your change was small. The system amplifies everything, and the difference between two nearly identical starting points is the difference between two completely different worlds.

The sensitivity is the story.`;
};

const chaos_theSimulation: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The Simulation

I ran the simulation. All 100 versions. Here's what emerged.

**${trend.title}** doesn't converge on a single outcome. It doesn't even converge on a category of outcomes. The distribution is ${temp} — spread across everything from "nobody remembers this in two weeks" to "this reshapes the entire landscape."

But here's the interesting part: within the chaos, there are attractors. Patterns that show up in 60 of the 100 runs. Not certainties — tendencies. The system is chaotic, but it's not random. There are shapes in the noise, and if you squint at ${topQueries(trend)} long enough, you can see them.

The simulation doesn't give you the answer. It gives you the topology of possible answers. And in a chaotic system, that's the best anyone can do.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 15. MURPHY'S LAW
//     Voice: catastrophe mapper — failure stacking, compound risk
// ═══════════════════════════════════════════════════════════════════════════════

const murphy_failureOne: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## Failure #1: The One Everyone's Watching

Here's every way this goes wrong. Starting with the one nobody's watching.

Just kidding. Let's start with the obvious one. The failure mode around **${trend.title}** that everybody sees: the ${temp} risk sitting in plain sight. ${topQueries(trend)} — it's right there. Pundits are discussing it. ${trend.traffic} searches are worrying about it.

This failure, on its own, is survivable. Uncomfortable, maybe expensive, but survivable. Organizations have playbooks for this failure. Insurance covers this failure. This failure has a name and a response plan.

Failure #1 isn't the problem. Failure #1 is the distraction.`;
};

const murphy_failureTwo: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## Failure #2: The Adjacent Break

While everyone watches Failure #1, something ${temp} is happening next door.

Failure #2 around **${trend.title}** is the adjacent system that nobody stress-tested because it wasn't supposed to be under stress. It's the dependency that worked fine in isolation. The API that never timed out. The supply chain that was "resilient."

${trend.relatedQueries[1] || "The secondary impact"} — that's where Failure #2 lives. Not in the headlines. In the footnotes. In the third paragraph of the incident report that nobody reads until the incident happens.

Failure #2 alone? Also survivable. Annoying, but survivable.

We're not done counting.`;
};

const murphy_failureThree: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## Failure #3: The Silent One

Failure #3 is ${temp} and silent. It's been failing for weeks. Nobody noticed.

This is the one connected to **${trend.title}** that doesn't set off alarms because nobody built alarms for it. It's the degradation nobody measured. The assumption nobody challenged. The "that'll never happen" scenario that is, right now, quietly happening.

${topQueries(trend)} won't tell you about Failure #3. It doesn't trend. It doesn't generate ${trend.traffic} searches. It just sits there, eroding the foundation, waiting for the moment when Failures #1 and #2 arrive and find the floor already weakened.

One failure is an incident. Two failures is a bad day. Three failures at once?`;
};

const murphy_theCompound: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 3);
  return `## The Compound

Three failures. Each survivable alone. Together? ${temp.charAt(0).toUpperCase() + temp.slice(1)}.

**${trend.title}** just discovered what Murphy always knew: the question isn't *if* something goes wrong. It's how many things go wrong simultaneously. The playbook for Failure #1 assumes #2 and #3 are working. The playbook for #2 assumes the foundation is solid. The playbook for #3 doesn't exist.

The compound failure — the ${temp} convergence of everything breaking at once — is always treated as impossibly unlikely. And it is unlikely. Right up until it happens. Then it's inevitable, obvious in hindsight, and someone writes a report that says "a perfect storm of factors."

It's not a perfect storm. It's Murphy's Law with a longer fuse.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 16. MACHIAVELLI
//     Voice: palace insider — public layer then private layer
// ═══════════════════════════════════════════════════════════════════════════════

const machiavelli_thePublicMove: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## The Public Move

The announcement was for the public. The strategy was for insiders.

**${trend.title}** — ${temp} on the surface. ${trend.traffic} searches absorbing the official narrative, the press release, the curated version. ${topQueries(trend)} all discussing what they were *meant* to discuss. The public move is clean, legible, designed to be consumed.

And it's real. I'm not saying it's fake. The public move happened. The words were said. The action was taken. It's just that the public move is the first floor of a building with a basement, and nobody's invited to the basement.

The public layer is where the conversation happens. The private layer is where the decision was made. Let's go downstairs.`;
};

const machiavelli_thePowerPlay: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## The Power Play

Downstairs, the logic is different.

The power play behind **${trend.title}** isn't about what was said — it's about what was positioned. While the public debated the ${temp} surface story, assets moved. Alliances shifted. The chess pieces on the board that matters — not the one on the news, the one in the room — rearranged in ways that won't be visible for weeks.

${topQueries(trend)} will catch up eventually. They always do. But by the time the public narrative incorporates the power play, the play is already complete. That's the whole point. The announcement buys time. The strategy uses it.

Someone needed something from this moment. Not attention — they got that for free. Something specific. Something ${temp}.`;
};

const machiavelli_theRealGame: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The Real Game

Pull the lens back. Way back. The real game around **${trend.title}** isn't about this move at all.

This was one move in a longer game — a game so ${temp} and patient that the individual moves look like reactions when they're actually sequences. The ${trend.traffic} searches see an event. The players see a campaign.

The real game has three characteristics: it's longer than the news cycle, it's quieter than the public debate, and it's already further along than anyone outside the room realizes.

Machiavelli didn't write a book about being evil. He wrote a book about being strategic. The distinction matters. The player behind **${trend.title}** read the book. The question is which chapter they're on.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 17. OVERTON WINDOW
//     Voice: timeline compressor — showing the shift compressed
// ═══════════════════════════════════════════════════════════════════════════════

const overton_theExtreme: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## The Extreme

Five years ago, **${trend.title}** was unthinkable. Say it in a meeting and you'd get stares. Publish it and you'd get corrections. Bring it up at dinner and someone would change the subject.

It was outside the window — the Overton window, that invisible frame around what a society considers ${temp} enough to discuss seriously. Not illegal, not impossible, just... not on the table. The kind of idea that lived in the margins, in the comment sections, in the "fringe" category.

${topQueries(trend)} would have returned nothing relevant back then. ${trend.traffic} searches? Zero. The concept existed, but the permission to engage with it publicly did not.

That was five years ago. Watch what happened next.`;
};

const overton_theShift: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## The Shift

The shift didn't happen overnight. It never does.

**${trend.title}** moved from unthinkable to radical to acceptable through a series of ${temp} nudges — each one small enough to deny, large enough to accumulate. A podcast here. A think piece there. Someone credible saying it out loud and not getting destroyed. Someone else saying it louder.

${topQueries(trend)} shows the trajectory compressed into search data: the queries got bolder, the qualifiers dropped away, the "what if" became "when." The window moved not because someone pushed it, but because a thousand people leaned on it from the same side.

The discourse around **${trend.title}** is ${temp} now. The temperature changed so gradually that the people inside the window didn't feel it move.`;
};

const overton_theNewNormal: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The New Normal

And now it's on the table. ${trend.traffic} searches confirm: **${trend.title}** is not fringe anymore. It's policy. It's platform. It's talking point. The thing that was ${temp} and unthinkable five years ago is now the center of a legitimate, mainstream conversation.

The Overton window didn't break. It relocated. And the people who were "extreme" for discussing it early are now "prescient." The people who said "that'll never happen" are now saying "well, obviously."

${topQueries(trend)} reads like a timeline of normalization, compressed into a search bar.

Here's the real question: what's outside the window *now* that'll be on the table in five years? Because the window is still moving. It's always moving. And by the time you notice, the shift is already done.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 18. NETWORK EFFECT
//     Voice: tipping point tracker — flat, flat, flat, VERTICAL
// ═══════════════════════════════════════════════════════════════════════════════

const network_theQuietPhase: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## The Quiet Phase

For months, nothing.

**${trend.title}** existed. Technically. In the way that a seed in the ground exists — present, patient, ${temp}, and completely invisible to anyone not digging. The search volume was flat. The mentions were sparse. The early adopters were talking to each other in a room that felt, frankly, empty.

${topQueries(trend)} barely registered. The chart was a flatline, and flatlines don't get funding, don't get coverage, don't get taken seriously.

This is the phase that gets edited out of the success story later. The months of nothing. The ${temp} silence before the noise. The part where everyone who eventually claims they "saw it early" was actually somewhere else, paying attention to something louder.

The quiet phase is where the network was building. One node at a time. Invisible.`;
};

const network_theTippingPoint: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## The Tipping Point

And then — in a week — everything happened.

The chart for **${trend.title}** went vertical. Not "strong growth." Not "upward trend." Vertical. ${trend.traffic} searches materialized from a standing start, and the ${temp} explanation is simpler than it looks: network effects don't grow linearly. They don't grow at all, until they do, and then they grow at the speed of connection.

${topQueries(trend)} — all of it igniting simultaneously. Not because something changed about the product or the idea or the policy. Because the network reached the density where every new node added value to every existing node, and the equation flipped from "why would I join" to "why wouldn't I."

The tipping point isn't a moment. It's a phase transition. Liquid to gas. ${temp.charAt(0).toUpperCase() + temp.slice(1)} and irreversible.`;
};

const network_theExplosion: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The Explosion

The hockey stick is real and it's ${temp}.

**${trend.title}** isn't growing anymore. Growth implies effort. This is compounding — each new participant making the network more valuable, which attracts more participants, which makes it more valuable, which attracts more. The loop is feeding itself.

${trend.traffic} searches and accelerating. The curve has gone parabolic. The early flatline is now a joke in retrospect — "remember when nobody cared about this?" — and the people who were in the empty room are now either very rich or very influential or both.

The explosion phase has one rule: winner takes all. The network that hits critical mass first absorbs the attention, the resources, the oxygen. Second place in a network effect isn't silver. It's irrelevant.

**${trend.title}** just crossed that line. The explosion is not a forecast. It's a photograph.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 19. CREATIVE DESTRUCTION
//     Voice: eulogist and birth announcer — death then emergence
// ═══════════════════════════════════════════════════════════════════════════════

const creative_theEulogy: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## The Eulogy

Something just died. Let's give it the respect it deserves before we move on.

**${trend.title}** marks the end of something — something that was ${temp} and important and now isn't. It served its purpose. It had its era. The ${trend.traffic} searches aren't mourning, exactly, but they're bearing witness to a closing that matters even if the timeline has already scrolled past it.

${topQueries(trend)} reads like an obituary written by the replacement. Every search is simultaneously a goodbye to the old and a hello to the new.

The thing that died wasn't weak. That's the part people get wrong about creative destruction. It was strong. It was dominant. It was so successful that it built the infrastructure the next thing is standing on.

Rest in disruption.`;
};

const creative_theEmergence: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## The Emergence

The thing replacing it is already here. It arrived before the funeral ended.

**${trend.title}** isn't just an ending — it's a ${temp} beginning disguised as a crisis. The ${trend.traffic} searches that look like panic are actually exploration. The conversations around ${topQueries(trend)} that sound like grief are actually adaptation.

Something new is pushing through the rubble, and it's doing what new things always do: looking nothing like what it's replacing while solving the same fundamental problem in a way that makes the old solution look like a horse next to a highway.

The emergence is ${temp}. It's raw. It doesn't have polish yet because polish is a luxury of incumbency, and the emerging thing is too busy growing to smooth its edges.`;
};

const creative_theNewLandscape: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The New Landscape

The dust is settling. Let's survey what's left.

**${trend.title}** redrew the map. Where the old thing stood, there's a gap — ${temp} and temporary — and the new thing is filling it fast, reshaping the contours as it grows. ${topQueries(trend)} reflects a landscape in transition: some searches looking backward, more looking forward, and a few standing at the crossover point trying to see both directions at once.

Schumpeter called this creative destruction because both words carry equal weight. The destruction is real — jobs lost, empires ended, certainties dissolved. And the creation is real — new jobs, new empires, new certainties that will themselves be destroyed when their time comes.

The cycle doesn't apologize. The cycle is the economy breathing. **${trend.title}** is an exhale. The inhale is already underway.`;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 20. ZERO SUM
//     Voice: game reframer — show the fight, then reframe
// ═══════════════════════════════════════════════════════════════════════════════

const zeroSum_theBattle: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 0);
  return `## The Battle

Everyone's fighting over the pie. Let me show you the fight first.

**${trend.title}** has turned into a ${temp} war of attrition. ${trend.traffic} searches and every single one picking a side. ${topQueries(trend)} — it's all framed as versus. Win/lose. Us/them. One side gains exactly what the other side loses.

The battle lines are drawn and they're rigid. Every inch of ground is contested. Every concession is a defeat. The framing is total, absolute, zero-sum: there is a fixed amount of whatever's at stake, and every player's job is to grab the biggest share.

This framing is ${temp}. It's also contagious. Once the fight is framed as zero-sum, every participant starts behaving as if it is, which makes it look even more like it is.

But what if it isn't?`;
};

const zeroSum_theReframe: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 1);
  return `## The Reframe

Same situation. Different game. Watch.

**${trend.title}** looks zero-sum because it's being *played* as zero-sum. But strip the framing away — strip the ${temp} rhetoric, the team jerseys, the scoreboard mentality — and look at the underlying assets.

Is the pie actually fixed? Or is everyone so busy fighting over slices that nobody's noticing the pie could get bigger? ${topQueries(trend)} suggests there's unclaimed territory that neither side is pursuing because pursuing it would require a posture that isn't "attack."

The reframe is ${temp} and uncomfortable: what if the win condition isn't "I get more than you" but "there's more for everyone"? Not because it's nice. Because it's mathematically superior. Positive-sum games generate more total value than zero-sum ones. Always.

The question is whether anyone in the fight can hear that over the sound of their own battle cry.`;
};

const zeroSum_theNewGame: SectionBuilder = (trend, mood) => {
  const temp = pickWord(mood, trend, 2);
  return `## The New Game

What if the pie could get bigger?

**${trend.title}** is at a fork. Down one path: the zero-sum war continues, ${trend.traffic} searches remain divided, the winners win less than they expected and the losers lose more. Down the other path: someone steps off the battlefield and starts building, and the ${temp} realization hits that there was never a fixed pie — just a fixed mindset.

${topQueries(trend)} holds both paths. Both are live. Both have momentum. The zero-sum path has more soldiers but the positive-sum path has better math.

The new game isn't about winning the old fight. It's about making the old fight irrelevant. That's ${temp}, and rare, and the only move that actually changes the outcome instead of redistributing the same one.

Everyone's fighting over the pie. The player who bakes a bigger one wins the game nobody else was playing.`;
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
  {
    id: "domino_theory",
    name: "Domino Theory",
    group: "economics_strategy",
    voice:
      "numbered countdown — tracking each domino as it tips the next",
    rhythm:
      "sequential, building inevitability. Each section IS a domino falling.",
    readerRelationship:
      "I'm counting down for you. You feel the chain building.",
    sections: [
      domino_firstDomino,
      domino_secondDomino,
      domino_thirdAndFourth,
      domino_fifthDomino,
      domino_theChainComplete,
    ],
    outcomes: [
      [
        { label: "The Full Chain", description: "Every domino fell in sequence — the chain completed exactly as physics demanded." },
        { label: "The Firewall", description: "Something stopped the chain — a gap, a brace, a deliberate intervention that absorbed the momentum." },
        { label: "The Skip", description: "One domino fell, the next held, and the third fell anyway — the chain jumped a gap." },
        { label: "The Reverse Cascade", description: "The chain reversed — downstream effects pushed back upstream, toppling the original mover." },
      ],
    ],
    affinities: {
      politics: 0.9,
      economy: 0.85,
      society: 0.8,
      tech: 0.5,
      sports: 0.3,
      entertainment: 0.2,
    },
    keywords: [
      "fall", "next", "chain", "sequence", "collapse",
      "follow", "inevitable", "one after",
    ],
  },
  {
    id: "greater_fool",
    name: "Greater Fool",
    group: "economics_strategy",
    voice:
      "market insider whispering — hype building then cliff reveal",
    rhythm:
      "upbeat turns dark. Building euphoria then pulling the rug.",
    readerRelationship:
      "I'm letting you peek behind the curtain before the music stops.",
    sections: [
      greaterFool_theRush,
      greaterFool_theSmartExit,
      greaterFool_theCliff,
    ],
    outcomes: [
      [
        { label: "The Musical Chairs", description: "The music stopped and someone was left standing — the last buyer holds the bag." },
        { label: "Soft Landing", description: "The decline was managed — gradual enough that nobody got crushed." },
        { label: "The Bagholder", description: "One player absorbed the entire loss — everyone else exited just in time." },
        { label: "The Greater Greater Fool", description: "Against all logic, a new wave of buyers arrived — the bubble re-inflated." },
      ],
    ],
    affinities: {
      economy: 0.95,
      tech: 0.8,
      entertainment: 0.6,
      sports: 0.4,
      politics: 0.3,
      society: 0.3,
    },
    keywords: [
      "buy", "sell", "bubble", "price", "valuation",
      "hype", "overvalued", "mania", "crash", "exit",
    ],
  },
  {
    id: "tragedy_of_commons",
    name: "Tragedy of the Commons",
    group: "economics_strategy",
    voice:
      "systems observer watching logic create disaster — rational actors, collective ruin",
    rhythm:
      "parallel tracks converging. Show each actor separately then the collision.",
    readerRelationship:
      "I'm showing you the math that makes everyone right and everyone doomed.",
    sections: [
      commons_playerA,
      commons_playerB,
      commons_theCollision,
      commons_theParadox,
    ],
    outcomes: [
      [
        { label: "The Commons Collapse", description: "The shared resource depleted — everyone took rationally and the commons died." },
        { label: "The Cooperation Miracle", description: "Against incentives, the actors cooperated — collective restraint saved the commons." },
        { label: "The Regulation Fix", description: "External rules imposed order — the invisible hand got a visible leash." },
        { label: "The Slow Bleed", description: "Neither collapse nor recovery — a gradual, manageable, permanent decline." },
      ],
    ],
    affinities: {
      society: 0.95,
      economy: 0.85,
      politics: 0.8,
      tech: 0.4,
      sports: 0.2,
      entertainment: 0.2,
    },
    keywords: [
      "shared", "resource", "deplete", "collective", "individual",
      "common", "overuse", "sustainable", "tragedy",
    ],
  },
  {
    id: "bandwagon_effect",
    name: "Bandwagon Effect",
    group: "psychology_behavior",
    voice:
      "trend analyst watching the wave — momentum then exposure",
    rhythm:
      "momentum building then exposure. The wave is the story, then we look underneath.",
    readerRelationship:
      "I'm showing you the wave from the outside while you decide if you're on it.",
    sections: [
      bandwagon_theWave,
      bandwagon_thePeelBack,
      bandwagon_theGap,
    ],
    outcomes: [
      [
        { label: "The Wave Holds", description: "The bandwagon was right — popular consensus turned out to be correct." },
        { label: "The Bandwagon Breaks", description: "The wave crashed — popularity masked a fundamental flaw." },
        { label: "The Quiet Correction", description: "The bandwagon slowly deflated — no crash, just a gradual loss of conviction." },
        { label: "The New Bandwagon", description: "The old wave died but a new one immediately formed — same crowd, new direction." },
      ],
    ],
    affinities: {
      entertainment: 0.9,
      economy: 0.8,
      sports: 0.75,
      society: 0.6,
      politics: 0.5,
      tech: 0.4,
    },
    keywords: [
      "viral", "trending", "everyone", "popular", "mainstream",
      "bandwagon", "wave", "movement", "followers",
    ],
  },
  {
    id: "sunk_cost",
    name: "Sunk Cost",
    group: "psychology_behavior",
    voice:
      "sympathetic truth-teller — showing the weight of what's already spent",
    rhythm:
      "weight accumulating. Each section adds more investment, more trapped.",
    readerRelationship:
      "I see the trap you're in. I'm not judging. I'm mapping the exit.",
    sections: [
      sunkCost_theInvestment,
      sunkCost_theEscalation,
      sunkCost_theTrap,
      sunkCost_theChoice,
    ],
    outcomes: [
      [
        { label: "The Walk Away", description: "They cut their losses — absorbed the pain and freed future decisions from the past." },
        { label: "The Double Down", description: "They invested more — the sunk cost deepened and the trap tightened." },
        { label: "The Pivot", description: "They found a third option — redirecting the investment rather than abandoning or doubling it." },
        { label: "The Sunk Ship", description: "Total commitment, total loss — the investment consumed everything and returned nothing." },
      ],
    ],
    affinities: {
      economy: 0.85,
      sports: 0.8,
      politics: 0.75,
      tech: 0.6,
      entertainment: 0.4,
      society: 0.4,
    },
    keywords: [
      "invested", "committed", "too far", "can't stop", "already spent",
      "quit", "continue", "cost", "abandon",
    ],
  },
  {
    id: "confirmation_bias",
    name: "Confirmation Bias",
    group: "psychology_behavior",
    voice:
      "devil's advocate — holding both sides up and finding the third angle",
    rhythm:
      "dual perspective with hidden third angle. Two columns then the reveal.",
    readerRelationship:
      "I'm not picking a side. I'm showing you the sides you didn't know existed.",
    sections: [
      confirmation_sideA,
      confirmation_sideB,
      confirmation_theMissing,
      confirmation_theThirdAngle,
    ],
    outcomes: [
      [
        { label: "Side A Wins", description: "Side A's interpretation proved correct — their filtered view happened to match reality." },
        { label: "Side B Wins", description: "Side B's reading was right — their evidence carried the day." },
        { label: "Both Were Wrong", description: "Neither filtered view captured the truth — the third angle was the real story." },
        { label: "The Nuance", description: "The truth contained elements of both — reality refused to pick a side." },
      ],
    ],
    affinities: {
      politics: 0.95,
      society: 0.85,
      sports: 0.7,
      economy: 0.6,
      tech: 0.5,
      entertainment: 0.4,
    },
    keywords: [
      "bias", "believe", "evidence", "both sides", "narrative",
      "perception", "cherry pick", "selective",
    ],
  },
  {
    id: "herd_mentality",
    name: "Herd Mentality",
    group: "psychology_behavior",
    voice:
      "aerial observer watching the stampede — tracking from above what the crowd can't see",
    rhythm:
      "tracking from above. See what the herd can't. Wide shots tightening.",
    readerRelationship:
      "I've got the altitude. You're getting the view the crowd doesn't have.",
    sections: [
      herd_theStampede,
      herd_theEdge,
      herd_theAerial,
    ],
    outcomes: [
      [
        { label: "The Cliff", description: "The stampede ran off the edge — the crowd's momentum carried it past the point of recovery." },
        { label: "The Soft Landing", description: "The herd found water — the direction was right even if the method was chaotic." },
        { label: "The Breakaway", description: "A splinter group broke from the herd and found a better path." },
        { label: "The U-Turn", description: "The entire herd reversed — a sudden counter-signal turned the stampede around." },
      ],
    ],
    affinities: {
      economy: 0.85,
      entertainment: 0.8,
      society: 0.75,
      politics: 0.6,
      sports: 0.5,
      tech: 0.4,
    },
    keywords: [
      "crowd", "herd", "follow", "mass", "panic",
      "flock", "group", "collective", "stampede",
    ],
  },
  {
    id: "black_swan",
    name: "Black Swan",
    group: "systems_chaos",
    voice:
      "post-mortem analyst — dissecting the gap between the model and reality",
    rhythm:
      "model vs reality divergence, then the lesson. Clinical then philosophical.",
    readerRelationship:
      "I'm walking you through the autopsy. We're both learning what the model missed.",
    sections: [
      blackSwan_theModel,
      blackSwan_theReality,
      blackSwan_theLessonInHindsight,
    ],
    outcomes: [
      [
        { label: "The True Black Swan", description: "Genuinely unprecedented — no model could have caught it. The unknown unknown." },
        { label: "The Grey Swan", description: "Should've seen it — the signs were there for anyone willing to look outside the model." },
        { label: "The White Swan", description: "It was predicted — someone had it in their model, just nobody listened." },
        { label: "The Flock", description: "More are coming — the first black swan was a scout, not a loner." },
      ],
    ],
    affinities: {
      economy: 0.9,
      tech: 0.85,
      society: 0.7,
      politics: 0.6,
      sports: 0.4,
      entertainment: 0.3,
    },
    keywords: [
      "unprecedented", "model", "predict", "forecast", "impossible",
      "unforeseen", "outlier", "tail risk", "black swan",
    ],
  },
  {
    id: "chaos_theory",
    name: "Chaos Theory",
    group: "systems_chaos",
    voice:
      "simulation runner — testing variables, watching outputs diverge",
    rhythm:
      "variable sensitivity. Change one input, watch the output diverge wildly.",
    readerRelationship:
      "I'm running the simulations. You're watching the outputs with me.",
    sections: [
      chaos_theVariables,
      chaos_theSensitivity,
      chaos_theSimulation,
    ],
    outcomes: [
      [
        { label: "The Stable Attractor", description: "Despite the chaos, the system converged — a hidden equilibrium pulled everything toward one outcome." },
        { label: "The Bifurcation", description: "The system split — two equally likely outcomes emerged and the path between them vanished." },
        { label: "The Strange Attractor", description: "Chaotic but patterned — the system never repeats but orbits a recognizable shape." },
        { label: "Pure Chaos", description: "No pattern, no attractor, no convergence — genuine unpredictability in every direction." },
      ],
    ],
    affinities: {
      sports: 0.85,
      politics: 0.8,
      economy: 0.75,
      tech: 0.6,
      society: 0.5,
      entertainment: 0.4,
    },
    keywords: [
      "chaos", "variable", "sensitive", "unpredictable", "random",
      "system", "complex", "turbulence", "nonlinear",
    ],
  },
  {
    id: "murphys_law",
    name: "Murphy's Law",
    group: "systems_chaos",
    voice:
      "catastrophe mapper — stacking failures, starting with the one nobody's watching",
    rhythm:
      "failure stacking. Each failure survivable alone. Together? Not.",
    readerRelationship:
      "I'm the disaster planner. Let me show you the compound risk nobody calculated.",
    sections: [
      murphy_failureOne,
      murphy_failureTwo,
      murphy_failureThree,
      murphy_theCompound,
    ],
    outcomes: [
      [
        { label: "The Perfect Storm", description: "All failures converged simultaneously — the compound effect exceeded the sum of its parts." },
        { label: "The Near Miss", description: "Two of three failures hit but the third didn't — close enough to terrify, not enough to destroy." },
        { label: "The Single Point", description: "One failure cascaded and the other two were irrelevant — a single point brought everything down." },
        { label: "The Resilient System", description: "All three failures hit and the system held — built tougher than the disaster planners realized." },
      ],
    ],
    affinities: {
      tech: 0.9,
      sports: 0.8,
      society: 0.7,
      economy: 0.6,
      politics: 0.5,
      entertainment: 0.3,
    },
    keywords: [
      "fail", "wrong", "break", "error", "bug",
      "crash", "risk", "worst case", "murphy",
    ],
  },
  {
    id: "machiavelli",
    name: "Machiavelli",
    group: "power_society",
    voice:
      "palace insider — peeling back the public layer to reveal the private strategy",
    rhythm:
      "public layer then private layer. Peel it back. Each section goes deeper.",
    readerRelationship:
      "I'm taking you to the room where it actually happened.",
    sections: [
      machiavelli_thePublicMove,
      machiavelli_thePowerPlay,
      machiavelli_theRealGame,
    ],
    outcomes: [
      [
        { label: "The Prince Wins", description: "The strategic player achieved their real objective — the public never saw the actual game." },
        { label: "The People's Counter", description: "The public saw through it — transparency defeated strategy." },
        { label: "The Mutual Backfire", description: "Both the public move and the private strategy failed — overplanning created its own trap." },
        { label: "The Long Game", description: "This was one move in a longer sequence — the outcome won't be visible for months." },
      ],
    ],
    affinities: {
      politics: 0.95,
      economy: 0.7,
      entertainment: 0.65,
      society: 0.5,
      tech: 0.3,
      sports: 0.2,
    },
    keywords: [
      "power", "strategy", "announce", "behind", "real reason",
      "calculate", "control", "manipulate", "influence",
    ],
  },
  {
    id: "overton_window",
    name: "Overton Window",
    group: "power_society",
    voice:
      "timeline compressor — showing how the unthinkable became the mainstream",
    rhythm:
      "fast-forward through time. Show the shift compressed. Then/now whiplash.",
    readerRelationship:
      "I'm compressing five years into five minutes so you can feel the shift.",
    sections: [
      overton_theExtreme,
      overton_theShift,
      overton_theNewNormal,
    ],
    outcomes: [
      [
        { label: "The Window Moves", description: "The shift stuck — what was extreme is now policy, and the window has a new center." },
        { label: "The Snapback", description: "The window overextended and snapped back — the shift was too fast and society corrected." },
        { label: "The Permanent Shift", description: "No going back — the old normal is now the extreme position." },
        { label: "The Overshoot", description: "The window moved past the new position — what was radical became mainstream became mandatory." },
      ],
    ],
    affinities: {
      politics: 0.95,
      society: 0.9,
      tech: 0.7,
      economy: 0.5,
      entertainment: 0.4,
      sports: 0.2,
    },
    keywords: [
      "normal", "acceptable", "radical", "mainstream", "shift",
      "once unthinkable", "window", "opinion", "discourse",
    ],
  },
  {
    id: "network_effect",
    name: "Network Effect",
    group: "power_society",
    voice:
      "tipping point tracker — narrating the phase transition from nothing to everything",
    rhythm:
      "flat, flat, flat, VERTICAL. Hockey stick energy. Patience then explosion.",
    readerRelationship:
      "I'm showing you the curve. You're watching the moment it bends.",
    sections: [
      network_theQuietPhase,
      network_theTippingPoint,
      network_theExplosion,
    ],
    outcomes: [
      [
        { label: "The Hockey Stick", description: "The curve went vertical and stayed there — exponential growth became the new baseline." },
        { label: "The Plateau", description: "Growth hit a ceiling — the network saturated before winner-takes-all kicked in." },
        { label: "The Winner Takes All", description: "One network absorbed everything — competitors collapsed as the leader crossed critical mass." },
        { label: "The Network Collapse", description: "The network imploded — growth reversed and the compound effect worked in reverse." },
      ],
    ],
    affinities: {
      tech: 0.95,
      economy: 0.8,
      entertainment: 0.75,
      society: 0.5,
      politics: 0.4,
      sports: 0.3,
    },
    keywords: [
      "adoption", "users", "growth", "viral", "tipping point",
      "critical mass", "exponential", "network", "platform",
    ],
  },
  {
    id: "creative_destruction",
    name: "Creative Destruction",
    group: "power_society",
    voice:
      "eulogist and birth announcer — mourning the old while celebrating the new",
    rhythm:
      "eulogy energy first, then excitement for what's born. Death and birth in one breath.",
    readerRelationship:
      "I'm at both the funeral and the christening. Come stand with me.",
    sections: [
      creative_theEulogy,
      creative_theEmergence,
      creative_theNewLandscape,
    ],
    outcomes: [
      [
        { label: "The Clean Replace", description: "The new thing fully replaced the old — a complete generational handoff." },
        { label: "The Zombie", description: "The old thing refuses to die — diminished but still breathing, blocking the new." },
        { label: "The Hybrid", description: "Old and new merged — the replacement absorbed the predecessor instead of killing it." },
        { label: "The Void", description: "The old thing died and nothing replaced it — creative destruction without the creative part." },
      ],
    ],
    affinities: {
      tech: 0.95,
      economy: 0.85,
      entertainment: 0.7,
      society: 0.5,
      politics: 0.3,
      sports: 0.2,
    },
    keywords: [
      "die", "replace", "new", "old", "disruption",
      "obsolete", "emerge", "innovation", "kill", "shutdown",
    ],
  },
  {
    id: "zero_sum",
    name: "Zero Sum",
    group: "power_society",
    voice:
      "game reframer — showing the fight then asking if the game itself is wrong",
    rhythm:
      "show the fight, then reframe. Same situation, different game. Confrontation then liberation.",
    readerRelationship:
      "I'm not telling you who wins. I'm asking if you're playing the right game.",
    sections: [
      zeroSum_theBattle,
      zeroSum_theReframe,
      zeroSum_theNewGame,
    ],
    outcomes: [
      [
        { label: "Zero Sum Confirmed", description: "The pie was fixed — the fight was justified and the winner took from the loser." },
        { label: "The Pie Grows", description: "Someone found a way to expand the total — positive-sum thinking created new value." },
        { label: "The Lose-Lose", description: "The fight destroyed value — both sides ended up with less than they started." },
        { label: "The Unexpected Winner", description: "A third party won — while the two sides fought, someone else took the whole pie." },
      ],
    ],
    affinities: {
      politics: 0.9,
      sports: 0.85,
      economy: 0.8,
      society: 0.6,
      tech: 0.4,
      entertainment: 0.3,
    },
    keywords: [
      "win", "lose", "zero sum", "compete", "versus",
      "fight", "both", "trade", "deal", "negotiate",
    ],
  },
];

export const THEORY_REGISTRY: Map<string, Theory> = new Map(
  THEORIES.map((theory) => [theory.id, theory])
);

export function getTheory(id: string): Theory | undefined {
  return THEORY_REGISTRY.get(id);
}
