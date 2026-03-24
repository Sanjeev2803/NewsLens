import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WhatIfPageClient from "./WhatIfPageClient";

export const metadata: Metadata = {
  title: "What-If Dimension | NewsLens",
  description: "AI transforms trending news into speculative scenarios. Predict outcomes, build timelines, challenge reality.",
  openGraph: {
    title: "What-If Dimension | NewsLens",
    description: "AI-powered prediction engine — explore alternative futures from today's trending news.",
    type: "website",
  },
};

export default function WhatIfPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 px-4 md:px-6">
        <div className="max-w-7xl mx-auto py-6">
          <WhatIfPageClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
