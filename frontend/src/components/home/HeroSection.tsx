"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import OGTitle from "./OGTitle";
import ParticleField from "./ParticleField";

export default function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[50vh] md:min-h-[55vh] px-6 overflow-hidden">
      <ParticleField />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,107,0,0.06),transparent_60%)]" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-3xl">
        <OGTitle />

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 4 }}
          className="mt-3 text-base md:text-lg text-mist-gray/70 max-w-lg font-heading"
        >
          Real-time news intelligence across 10+ sources. Regional depth. Zero noise.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 4.3 }}
          className="mt-6 flex gap-3"
        >
          <Link
            href="/trending"
            className="px-5 py-2.5 rounded-xl bg-chakra-orange/90 text-sm font-heading font-semibold text-white hover:bg-chakra-orange transition-all shadow-[0_0_20px_rgba(255,107,0,0.2)]"
          >
            Open Dashboard
          </Link>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 5 }}
        className="absolute bottom-6 text-mist-gray/40"
      >
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
