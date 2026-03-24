import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scenario | What-If Dimension | NewsLens",
  description: "Explore this AI-generated speculative scenario — predict outcomes, view impact analysis, and challenge reality.",
  openGraph: {
    title: "What-If Scenario | NewsLens",
    description: "AI-powered prediction — explore alternative futures from trending news.",
    type: "article",
  },
};

export default function ScenarioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
