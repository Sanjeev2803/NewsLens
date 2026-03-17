"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

/*
  Lightweight particle background — replaces tsParticles (200KB+).
  Uses CSS + Framer Motion for 30 floating dots. No extra dependencies.
*/

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

export default function ParticleField() {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      opacity: 0.1 + Math.random() * 0.3,
      duration: 15 + Math.random() * 25,
      delay: Math.random() * -20,
    }));
  }, []);

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-chakra-orange"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            x: [0, 30 - Math.random() * 60, 0],
            y: [0, 20 - Math.random() * 40, 0],
            opacity: [p.opacity, p.opacity * 0.3, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
