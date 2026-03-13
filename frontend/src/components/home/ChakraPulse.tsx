"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

/*
  "Chakra Pulse" — Platform Capabilities Showcase
  3 feature cards: Rasengan Analysis, Sharingan Verification, Sage Mode Intelligence
*/

function RasenganIcon() {
  return (
    <motion.div
      className="relative w-20 h-20 mx-auto"
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    >
      <div className="absolute inset-0 rounded-full bg-rasengan-blue/20 blur-md" />
      <svg viewBox="0 0 80 80" className="relative w-full h-full">
        <circle cx="40" cy="40" r="32" fill="none" stroke="#00B4D8" strokeWidth="2" opacity="0.6" />
        <circle cx="40" cy="40" r="22" fill="none" stroke="#00B4D8" strokeWidth="1.5" opacity="0.4" />
        <circle cx="40" cy="40" r="12" fill="#00B4D8" opacity="0.5" />
        <circle cx="40" cy="40" r="6" fill="#48CAE4" />
        <motion.path
          d="M40 8 Q55 20 40 40 Q25 60 40 72"
          fill="none"
          stroke="#48CAE4"
          strokeWidth="1.5"
          opacity="0.5"
          animate={{ rotate: [0, 120, 240, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "40px 40px" }}
        />
      </svg>
    </motion.div>
  );
}

function SharinganIcon() {
  return (
    <motion.div className="relative w-20 h-20 mx-auto">
      <div className="absolute inset-0 rounded-full bg-sharingan-red/15 blur-md" />
      <motion.svg
        viewBox="0 0 100 100"
        className="relative w-full h-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="50" cy="50" r="38" fill="#1a0a0a" stroke="#E63946" strokeWidth="3" />
        {[0, 120, 240].map((a) => (
          <g key={a} transform={`rotate(${a} 50 50)`}>
            <circle cx="50" cy="20" r="6" fill="#E63946" />
          </g>
        ))}
        <circle cx="50" cy="50" r="10" fill="#E63946" />
        <circle cx="50" cy="50" r="4" fill="#1a0a0a" />
      </motion.svg>
    </motion.div>
  );
}

function SageEyeIcon() {
  return (
    <motion.div className="relative w-20 h-20 mx-auto">
      <div className="absolute inset-0 rounded-full bg-sage-green/15 blur-md" />
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ boxShadow: "0 0 20px rgba(45,198,83,0.3)" }}
        animate={{ boxShadow: ["0 0 15px rgba(45,198,83,0.2)", "0 0 30px rgba(45,198,83,0.5)", "0 0 15px rgba(45,198,83,0.2)"] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <svg viewBox="0 0 80 80" className="relative w-full h-full">
        <ellipse cx="40" cy="40" rx="30" ry="18" fill="none" stroke="#2DC653" strokeWidth="2.5" />
        <circle cx="40" cy="40" r="10" fill="#2DC653" opacity="0.6" />
        <rect x="37" y="32" width="6" height="16" rx="3" fill="#1a5c2a" />
        <line x1="22" y1="40" x2="12" y2="36" stroke="#FF6B00" strokeWidth="2" opacity="0.6" />
        <line x1="58" y1="40" x2="68" y2="36" stroke="#FF6B00" strokeWidth="2" opacity="0.6" />
      </svg>
    </motion.div>
  );
}

const FEATURES = [
  {
    title: "Rasengan Analysis",
    description: "AI-powered sentiment and bias analysis. See through spin, detect framing, and understand the true tone of every article.",
    icon: RasenganIcon,
    color: "#00B4D8",
    enterFrom: { x: -60, opacity: 0 },
  },
  {
    title: "Sharingan Verification",
    description: "Multi-source fact checking that cross-references claims across dozens of outlets. Every article gets a trust rank.",
    icon: SharinganIcon,
    color: "#E63946",
    enterFrom: { y: 40, opacity: 0 },
  },
  {
    title: "Sage Mode Intelligence",
    description: "Trending detection with power-level scoring. See which stories are gaining chakra and which are fading in real-time.",
    icon: SageEyeIcon,
    color: "#2DC653",
    enterFrom: { x: 60, opacity: 0 },
  },
];

export default function ChakraPulse() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { isItachi } = useTheme();

  const cardBg = isItachi ? "bg-ink-black/60 border-mist-gray/10" : "bg-white/60 border-[#8B0000]/10";
  const textPrimary = isItachi ? "text-scroll-cream" : "text-[#1a0a0a]";
  const textSecondary = isItachi ? "text-mist-gray" : "text-[#6a5a4a]";

  return (
    <section ref={ref} className="w-full max-w-6xl mx-auto py-16 px-6">
      <motion.h2
        className={`text-2xl md:text-3xl font-heading font-bold text-center mb-3 ${textPrimary}`}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        Chakra Pulse
      </motion.h2>
      <motion.p
        className={`text-sm text-center mb-12 ${textSecondary}`}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.2 }}
      >
        Three pillars of intelligence powering your news analysis
      </motion.p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURES.map((feat, i) => (
          <motion.div
            key={feat.title}
            className={`rounded-xl border backdrop-blur-sm p-8 text-center ${cardBg}`}
            initial={feat.enterFrom}
            animate={inView ? { x: 0, y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.2 + i * 0.15, ease: "easeOut" }}
            whileHover={{
              y: -6,
              boxShadow: `0 0 25px ${feat.color}33`,
              transition: { duration: 0.25 },
            }}
          >
            <div className="mb-6 animate-float" style={{ animationDelay: `${i * 0.5}s` }}>
              <feat.icon />
            </div>
            <h3
              className="text-lg font-heading font-bold mb-3"
              style={{ color: feat.color }}
            >
              {feat.title}
            </h3>
            <p className={`text-sm leading-relaxed ${textSecondary}`}>
              {feat.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
