"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

/*
  Itachi Crow Scatter — One-shot effect
  When scrolling past the hero boundary (Itachi mode only),
  5-8 crow silhouettes scatter outward and fade.
*/

const CROW_PATH =
  "M0 8c2-3 5-5 8-4 1-2 3-3 5-2C15 1 17 0 20 2c-2 1-3 3-4 5-1-1-3-1-4 0-1-1-3-2-5-1C5 5 3 4 2 6 1 5 0 7 0 8z";

export default function CrowScatter() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const { isItachi } = useTheme();

  if (!isItachi) return <div ref={ref} className="h-1" />;

  const crows = Array.from({ length: 7 }).map((_, i) => {
    const angle = ((i * 51 + 20) * Math.PI) / 180;
    const dist = 80 + (i % 3) * 50;
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 30,
      rot: (i % 2 === 0 ? 1 : -1) * (15 + i * 8),
      scale: 0.6 + (i % 3) * 0.2,
      delay: i * 0.06,
    };
  });

  return (
    <div ref={ref} className="relative h-1 w-full overflow-visible">
      {inView &&
        crows.map((c) => (
          <motion.svg
            key={c.id}
            width={20 * c.scale}
            height={10 * c.scale}
            viewBox="0 0 20 10"
            className="absolute left-1/2 top-0 pointer-events-none z-30"
            initial={{ x: 0, y: 0, opacity: 0.9, rotate: 0 }}
            animate={{
              x: c.x,
              y: c.y,
              opacity: [0.9, 0.7, 0],
              rotate: c.rot,
            }}
            transition={{
              duration: 1.2,
              delay: c.delay,
              ease: "easeOut",
            }}
          >
            <path d={CROW_PATH} fill="#1A1A2E" />
          </motion.svg>
        ))}
    </div>
  );
}
