"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

/*
  "Power Levels" — Animated Stats Dashboard
  Numbers count up from 0 when scrolled into view.
  Each stat has a power meter bar that fills with chakra glow.
*/

const STATS = [
  { label: "Articles Analyzed", value: 52400, suffix: "+", color: "#FF6B00" },
  { label: "Sources Monitored", value: 340, suffix: "+", color: "#00B4D8" },
  { label: "Topics Tracked", value: 1200, suffix: "+", color: "#2DC653" },
  { label: "Verification Rate", value: 94, suffix: "%", color: "#E63946" },
];

function CountUp({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1500;
    const step = 16;
    const totalSteps = duration / step;
    const increment = target / totalSteps;
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      start += increment;
      if (frame >= totalSteps) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, step);

    return () => clearInterval(timer);
  }, [inView, target]);

  const formatted = target >= 1000 ? `${(count / 1000).toFixed(count >= target ? 1 : 0)}K` : `${count}`;

  return <>{formatted}{suffix}</>;
}

export default function PowerLevels() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { isItachi } = useTheme();

  const textPrimary = isItachi ? "text-scroll-cream" : "text-[#1a0a0a]";
  const textSecondary = isItachi ? "text-mist-gray" : "text-[#6a5a4a]";

  return (
    <section ref={ref} className="w-full max-w-5xl mx-auto py-16 px-6">
      <motion.h2
        className={`text-2xl md:text-3xl font-heading font-bold text-center mb-12 ${textPrimary}`}
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        Power Levels
      </motion.h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.12 }}
          >
            <p className="text-3xl md:text-4xl font-brand mb-1" style={{ color: stat.color }}>
              <CountUp target={stat.value} suffix={stat.suffix} inView={inView} />
            </p>
            <p className={`text-xs md:text-sm font-heading mb-3 ${textSecondary}`}>
              {stat.label}
            </p>

            {/* Power meter bar */}
            <div className="relative h-1.5 rounded-full bg-mist-gray/15 overflow-hidden mx-auto max-w-[120px]">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${stat.color}88, ${stat.color})`,
                  boxShadow: `0 0 8px ${stat.color}66`,
                }}
                initial={{ width: 0 }}
                animate={inView ? { width: "100%" } : {}}
                transition={{ duration: 1.5, delay: 0.3 + i * 0.12, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
