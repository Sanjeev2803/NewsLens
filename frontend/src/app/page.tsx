import HeroSection from "@/components/home/HeroSection";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-18">
        <HeroSection />
      </main>
      <Footer />
    </>
  );
}
