"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

/*
  Summoning Smoke — One-shot particle poof
  Plays when section scrolls into view.
  25 gray/white particles expand outward from center and fade.
*/

export default function SummoningSmoke() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { isItachi } = useTheme();

  const smokeColor = isItachi ? "rgba(123,47,190,0.4)" : "rgba(255,107,0,0.3)";

  const particles = Array.from({ length: 25 }).map((_, i) => {
    const angle = (i * 14.4 * Math.PI) / 180;
    const dist = 40 + (i % 5) * 25;
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      size: 6 + (i % 4) * 4,
      delay: i * 0.015,
    };
  });

  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none overflow-hidden">
      {inView &&
        particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: p.size,
              height: p.size,
              background: `radial-gradient(circle, ${smokeColor} 0%, transparent 70%)`,
            }}
            initial={{ x: 0, y: 0, opacity: 0.7, scale: 0.3 }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: [0.7, 0.4, 0],
              scale: [0.3, 1.2, 1.5],
            }}
            transition={{
              duration: 0.8,
              delay: p.delay,
              ease: "easeOut",
            }}
          />
        ))}
    </div>
  );
}
