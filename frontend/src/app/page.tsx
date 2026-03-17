import HeroSection from "@/components/home/HeroSection";
import BreakingScrolls from "@/components/home/BreakingScrolls";
import NewsPulseMap from "@/components/home/NewsPulseMap";
import WhatsHot from "@/components/home/WhatsHot";
import PerspectiveLens from "@/components/home/PerspectiveLens";
import FeaturePeeks from "@/components/home/FeaturePeeks";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-18">
        {/* Brand identity */}
        <HeroSection />

        {/* Live news feed — editorial grid with trending ticker */}
        <BreakingScrolls />

        {/* Interactive world heatmap — live news hotspots */}
        <NewsPulseMap />

        {/* Viral per category — sports, tech, entertainment */}
        <WhatsHot />

        {/* Multi-platform perspective — same story, different platforms */}
        <PerspectiveLens />

        {/* Sneak peeks — What If, Creator Hub, Newsletter */}
        <FeaturePeeks />
      </main>
      <Footer />
    </>
  );
}
