"use client";

import { useRef, useMemo } from "react";
import { motion, useInView } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";
import Button from "@/components/ui/Button";
import Link from "next/link";

/*
  "Join the Village" — Community / Open Source CTA
  Drifting leaves (Hokage) or falling crows (Itachi) in background.
*/

const CROW_PATH =
  "M0 8c2-3 5-5 8-4 1-2 3-3 5-2C15 1 17 0 20 2c-2 1-3 3-4 5-1-1-3-1-4 0-1-1-3-2-5-1C5 5 3 4 2 6 1 5 0 7 0 8z";

const LEAF_PATH =
  "M10 0C6 2 2 6 1 10c0 3 2 5 4 5 3 0 6-3 7-6 1 3 4 6 7 6 2 0 4-2 4-5C22 6 18 2 14 0c-1 2-3 3-4 3S11 2 10 0z";

export default function JoinVillage() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { isItachi } = useTheme();

  const textPrimary = isItachi ? "text-scroll-cream" : "text-[#1a0a0a]";
  const textSecondary = isItachi ? "text-mist-gray" : "text-[#6a5a4a]";

  const drifters = useMemo(
    () =>
      Array.from({ length: 5 }).map((_, i) => ({
        id: i,
        x: 10 + (i * 18) % 80,
        delay: i * 1.5,
        duration: 6 + (i % 3) * 2,
        size: 12 + (i % 3) * 4,
        rot: (i % 2 === 0 ? 1 : -1) * (20 + i * 15),
      })),
    []
  );

  return (
    <section ref={ref} className="relative w-full max-w-4xl mx-auto py-20 px-6 overflow-hidden">
      {/* Drifting background elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {drifters.map((d) => (
          <motion.svg
            key={d.id}
            width={d.size}
            height={d.size}
            viewBox={isItachi ? "0 0 20 10" : "0 0 24 16"}
            className="absolute"
            style={{ left: `${d.x}%`, top: "-10%" }}
            animate={{
              y: ["0%", "120vh"],
              rotate: [0, d.rot],
              opacity: [0, 0.15, 0.1, 0],
            }}
            transition={{
              duration: d.duration,
              delay: d.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <path
              d={isItachi ? CROW_PATH : LEAF_PATH}
              fill={isItachi ? "#8B8BA3" : "#2DC653"}
              opacity="0.5"
            />
          </motion.svg>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 text-center">
        <motion.h2
          className={`text-2xl md:text-3xl font-heading font-bold mb-3 ${textPrimary}`}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          Join the Village
        </motion.h2>

        <motion.p
          className={`text-base max-w-md mx-auto mb-8 ${textSecondary}`}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          100% Open Source. Built by the Community.
          <br />
          <span className="text-sm">Every line of code, every algorithm — transparent and free.</span>
        </motion.p>

        <motion.div
          className="flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
        >
          <Button variant="secondary" size="lg">
            Star on GitHub
          </Button>
          <Link href="/trending">
            <Button size="lg">Enter the Arena</Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
