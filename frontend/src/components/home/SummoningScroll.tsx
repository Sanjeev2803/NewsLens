"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";
import Button from "@/components/ui/Button";
import SummoningSmoke from "./SummoningSmoke";
import NewsletterModal from "./NewsletterModal";

/*
  "Summoning Scroll" — Newsletter CTA Section
  Background: rotating summoning circle. Headline + CTA opens NewsletterModal.
*/

export default function SummoningScroll() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { isItachi } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);

  const accentColor = isItachi ? "#7B2FBE" : "#FF6B00";
  const glowBorder = isItachi
    ? "shadow-[0_0_30px_rgba(123,47,190,0.15)]"
    : "shadow-[0_0_30px_rgba(255,107,0,0.12)]";
  const textPrimary = isItachi ? "text-scroll-cream" : "text-[#1a0a0a]";
  const textSecondary = isItachi ? "text-mist-gray" : "text-[#6a5a4a]";

  return (
    <>
      <section
        ref={ref}
        className={`relative w-full max-w-4xl mx-auto py-20 px-6 rounded-2xl overflow-hidden ${glowBorder}`}
      >
        {/* Rotating summoning circle background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06]">
          <motion.svg
            viewBox="0 0 400 400"
            className="w-[500px] h-[500px]"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          >
            <circle cx="200" cy="200" r="180" fill="none" stroke={accentColor} strokeWidth="1" />
            <circle cx="200" cy="200" r="140" fill="none" stroke={accentColor} strokeWidth="0.8" />
            <circle cx="200" cy="200" r="100" fill="none" stroke={accentColor} strokeWidth="0.6" />
            <circle cx="200" cy="200" r="60" fill="none" stroke={accentColor} strokeWidth="0.5" />
            {/* Seal markings */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
              <line
                key={a}
                x1="200"
                y1="20"
                x2="200"
                y2="50"
                stroke={accentColor}
                strokeWidth="0.8"
                transform={`rotate(${a} 200 200)`}
              />
            ))}
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <rect
                key={`r-${a}`}
                x="195"
                y="65"
                width="10"
                height="10"
                rx="2"
                fill="none"
                stroke={accentColor}
                strokeWidth="0.6"
                transform={`rotate(${a} 200 200)`}
              />
            ))}
          </motion.svg>
        </div>

        {/* Summoning smoke entrance effect */}
        <SummoningSmoke />

        {/* Content */}
        <div className="relative z-10 text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-heading font-bold mb-4 text-gradient-orange"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Summon Your Intel
          </motion.h2>

          <motion.p
            className={`text-base md:text-lg max-w-xl mx-auto mb-8 ${textSecondary}`}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5 }}
          >
            Create personalized news briefings. Our AI analyzes, prioritizes, and
            delivers what matters most — straight to your inbox.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.6 }}
          >
            <Button size="lg" onClick={() => setModalOpen(true)}>
              Create Newsletter
            </Button>
          </motion.div>

          <motion.p
            className={`text-xs mt-4 ${textSecondary}`}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 0.6 } : {}}
            transition={{ delay: 0.8 }}
          >
            🛡 Maximum once daily. You confirm every send.
          </motion.p>
        </div>
      </section>

      <NewsletterModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
