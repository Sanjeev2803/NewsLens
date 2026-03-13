import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function TrendingPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 px-6">
        <div className="max-w-6xl mx-auto py-16 text-center">
          <h1 className="font-brand text-4xl md:text-6xl text-gradient-orange">
            Trending Battleground
          </h1>
          <p className="mt-4 text-mist-gray font-heading text-lg">
            Topic power levels charging... Coming in Phase 5.
          </p>
          <div className="mt-12 flex justify-center">
            <div className="w-16 h-16 rounded-lg border-2 border-chakra-orange/30 bg-chakra-orange/5 animate-pulse-glow" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
