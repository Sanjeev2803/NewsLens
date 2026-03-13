"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

/*
  Rasengan Cursor Trail — Hero section only
  3-4 spiraling dots follow the mouse cursor and fade after 300ms.
  Itachi mode: blue rasengan dots. Hokage mode: orange chakra dots.
*/

interface Particle {
  id: number;
  x: number;
  y: number;
}

export default function RasenganTrail() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const { isItachi } = useTheme();
  const color = isItachi ? "#00B4D8" : "#FF6B00";

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const target = e.currentTarget as HTMLElement | null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setParticles((prev) => {
      const next = [...prev, { id: Date.now() + Math.random(), x, y }];
      // Keep max 4 particles
      return next.slice(-4);
    });
  }, []);

  useEffect(() => {
    const el = document.getElementById("hero-section");
    if (!el) return;

    let throttled = false;
    const throttledMove = (e: MouseEvent) => {
      if (throttled) return;
      throttled = true;
      handleMouseMove(e);
      setTimeout(() => { throttled = false; }, 60);
    };

    el.addEventListener("mousemove", throttledMove);
    return () => el.removeEventListener("mousemove", throttledMove);
  }, [handleMouseMove]);

  // Auto-remove old particles
  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setTimeout(() => {
      setParticles((prev) => prev.slice(1));
    }, 300);
    return () => clearTimeout(timer);
  }, [particles]);

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      <AnimatePresence>
        {particles.map((p, i) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: p.x,
              top: p.y,
              width: 6 - i,
              height: 6 - i,
              backgroundColor: color,
              boxShadow: `0 0 ${8 - i * 2}px ${color}`,
            }}
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{
              opacity: 0,
              scale: 0.3,
              rotate: isItachi ? 180 : -180,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
