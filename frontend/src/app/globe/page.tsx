import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function GlobePage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 px-6">
        <div className="max-w-6xl mx-auto py-16 text-center">
          <h1 className="font-brand text-4xl md:text-6xl text-gradient-blue">
            World View
          </h1>
          <p className="mt-4 text-mist-gray font-heading text-lg">
            3D globe materializing... Coming in Phase 6.
          </p>
          <div className="mt-12 flex justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-rasengan-blue/30 bg-rasengan-blue/5 animate-spin-slow" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
