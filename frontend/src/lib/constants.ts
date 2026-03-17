// ── Design Tokens ──

export const COLORS = {
  chakraOrange: "#FF6B00",
  chakraOrangeLight: "#FF8C33",
  chakraOrangeDark: "#CC5500",
  sharinganRed: "#E63946",
  rasenganBlue: "#00B4D8",
  sageGreen: "#2DC653",
  amaterasuPurple: "#7B2FBE",
  scrollCream: "#F5E6C8",
  shadowDark: "#0A0A0F",
  inkBlack: "#1A1A2E",
  mistGray: "#8B8BA3",
} as const;

// ── Ninja Ranks (XP thresholds) ──

export const RANKS = [
  { name: "Academy Student", minXp: 0, color: COLORS.mistGray },
  { name: "Genin", minXp: 100, color: COLORS.sageGreen },
  { name: "Chunin", minXp: 500, color: COLORS.rasenganBlue },
  { name: "Jonin", minXp: 2000, color: COLORS.amaterasuPurple },
  { name: "ANBU", minXp: 5000, color: COLORS.sharinganRed },
  { name: "Kage", minXp: 10000, color: COLORS.chakraOrange },
  { name: "Hokage", minXp: 25000, color: COLORS.chakraOrange },
] as const;

// ── Sentiment Labels ──

export const SENTIMENT = {
  positive: { label: "Positive", color: COLORS.sageGreen, emoji: "+" },
  neutral: { label: "Neutral", color: COLORS.rasenganBlue, emoji: "~" },
  negative: { label: "Negative", color: COLORS.sharinganRed, emoji: "-" },
} as const;

// ── Verification Levels ──

export const VERIFICATION_LEVELS = [
  { level: 0, label: "Unverified", color: COLORS.mistGray },
  { level: 1, label: "Single Source", color: COLORS.sharinganRed },
  { level: 2, label: "Multi-Source", color: COLORS.chakraOrange },
  { level: 3, label: "Fact-Checked", color: COLORS.sageGreen },
] as const;

// ── Navigation ──

export const NAV_ITEMS = [
  { label: "Arena", href: "/", icon: "swords" },
  { label: "Trending", href: "/trending", icon: "trending-up" },
  { label: "Globe", href: "/globe", icon: "globe" },
  { label: "What If", href: "/whatif", icon: "sparkles" },
  { label: "Profile", href: "/profile", icon: "user" },
] as const;
