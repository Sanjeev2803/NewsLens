"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import ParticleField from "./ParticleField";
import OGTitle from "./OGTitle";

export default function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-6 overflow-hidden">
      {/* Particle background */}
      <ParticleField />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,107,0,0.08),transparent_60%)]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl">
        {/* Kalki-style cinematic title forge */}
        <OGTitle />

        {/* Subtitle fades in after title locks (8s) */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 5.5 }}
          className="mt-4 text-lg md:text-xl text-mist-gray max-w-xl font-heading"
        >
          See through the noise. AI-powered news analysis with real-time
          verification, sentiment tracking, and interactive visualizations.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 6 }}
          className="mt-10 flex gap-4"
        >
          <Button size="lg">Enter the Arena</Button>
          <Button variant="secondary" size="lg">
            Learn More
          </Button>
        </motion.div>

        {/* Floating stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 6.5 }}
          className="mt-16 grid grid-cols-3 gap-8 md:gap-16"
        >
          {[
            { value: "50K+", label: "Articles Analyzed" },
            { value: "Real-time", label: "Verification" },
            { value: "100%", label: "Open Source" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl md:text-3xl font-brand text-chakra-orange">
                {stat.value}
              </p>
              <p className="text-xs md:text-sm text-mist-gray mt-1 font-heading">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 7 }}
        className="absolute bottom-8 text-mist-gray/50"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
