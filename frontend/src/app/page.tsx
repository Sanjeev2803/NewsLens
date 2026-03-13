import HeroSection from "@/components/home/HeroSection";
import CrowScatter from "@/components/home/CrowScatter";
import SealDivider from "@/components/home/SealDivider";
import BreakingScrolls from "@/components/home/BreakingScrolls";
import ChakraPulse from "@/components/home/ChakraPulse";
import SummoningScroll from "@/components/home/SummoningScroll";
import PowerLevels from "@/components/home/PowerLevels";
import JoinVillage from "@/components/home/JoinVillage";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-18">
        <HeroSection />
        <CrowScatter />

        <SealDivider seal="tiger" />
        <BreakingScrolls />

        <SealDivider seal="snake" />
        <ChakraPulse />

        <SealDivider seal="dragon" />
        <SummoningScroll />

        <SealDivider seal="ram" />
        <PowerLevels />

        <SealDivider seal="tiger" />
        <JoinVillage />
      </main>
      <Footer />
    </>
  );
}
