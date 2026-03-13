"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

/*
  Jutsu Hand-Seal Section Divider
  A centered seal icon that glows when scrolled into view,
  with thin horizontal lines extending left and right.
*/

type SealType = "tiger" | "snake" | "dragon" | "ram";

const SEAL_PATHS: Record<SealType, string> = {
  tiger:
    "M12 2L8 6H4v4l-2 2 2 2v4h4l4 4 4-4h4v-4l2-2-2-2V6h-4L12 2zm0 4l2.5 2.5H17v2.5L19 12l-2 1V15.5H14.5L12 18l-2.5-2.5H7V13l-2-1 2-2V7.5h2.5L12 6z",
  snake:
    "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 3c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm-4 8c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4zm4 6c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z",
  dragon:
    "M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.5L18 8v8l-6 3.5L6 16V8l6-3.5zM12 8l-4 2.5v5L12 18l4-2.5v-5L12 8zm0 2l2 1.25v2.5L12 15l-2-1.25v-2.5L12 10z",
  ram:
    "M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a7 7 0 110 14 7 7 0 010-14zm0 2a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6zm0 1a2 2 0 100 4 2 2 0 000-4z",
};

export default function SealDivider({ seal = "tiger" }: { seal?: SealType }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const { isItachi } = useTheme();

  const glowColor = isItachi ? "rgba(230,57,70,0.6)" : "rgba(255,107,0,0.6)";
  const lineColor = isItachi ? "rgba(230,57,70,0.15)" : "rgba(255,107,0,0.15)";
  const iconColor = isItachi ? "#E63946" : "#FF6B00";

  return (
    <div ref={ref} className="relative flex items-center justify-center py-12">
      {/* Left line */}
      <motion.div
        className="flex-1 h-px"
        style={{ background: lineColor }}
        initial={{ scaleX: 0, originX: 1 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      />

      {/* Seal icon */}
      <motion.div
        className="relative mx-6"
        initial={{ opacity: 0.2, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.5 }}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d={SEAL_PATHS[seal]} />
        </svg>

        {/* Glow pulse on activation */}
        {inView && (
          <motion.div
            className="absolute inset-0 -m-3 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.5, 2] }}
            transition={{ duration: 0.8 }}
          />
        )}
      </motion.div>

      {/* Right line */}
      <motion.div
        className="flex-1 h-px"
        style={{ background: lineColor }}
        initial={{ scaleX: 0, originX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
      />
    </div>
  );
}
