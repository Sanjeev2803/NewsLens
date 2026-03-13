import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function WhatIfPage() {
  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 px-6">
        <div className="max-w-6xl mx-auto py-16 text-center">
          <h1 className="font-brand text-4xl md:text-6xl" style={{ color: "#7B2FBE" }}>
            What-If Dimension
          </h1>
          <p className="mt-4 text-mist-gray font-heading text-lg">
            Dimensional rift opening... Coming in Phase 8.
          </p>
          <div className="mt-12 flex justify-center">
            <div className="w-16 h-16 rounded-lg border-2 border-amaterasu-purple/30 bg-amaterasu-purple/5 animate-float" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
