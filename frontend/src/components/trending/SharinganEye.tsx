"use client";

import { motion } from "framer-motion";

function SharinganEye({ size = 24, spin = false, className = "", glow = false }: { size?: number; spin?: boolean; className?: string; glow?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`${className} ${glow ? "drop-shadow-[0_0_12px_rgba(204,0,0,0.6)]" : ""}`}
      animate={spin ? { rotate: 360 } : {}}
      transition={spin ? { duration: 3, repeat: Infinity, ease: "linear" } : {}}
    >
      <circle cx="50" cy="50" r="48" fill="#1a0000" stroke="#330000" strokeWidth="2" />
      <circle cx="50" cy="50" r="42" fill="#0d0000" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#660000" strokeWidth="1.5" />
      {/* Inner ring */}
      <circle cx="50" cy="50" r="28" fill="none" stroke="#880000" strokeWidth="0.8" opacity="0.5" />
      {/* Pupil */}
      <circle cx="50" cy="50" r="9" fill="#000" />
      <circle cx="50" cy="50" r="7" fill="#050505" />
      {/* Red iris glow */}
      <circle cx="50" cy="50" r="25" fill="none" stroke="#CC0000" strokeWidth="0.5" opacity="0.6" />
      {/* 3 Tomoe with tails */}
      {[0, 120, 240].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 50 50)`}>
          <circle cx="50" cy="20" r="7" fill="#CC0000" />
          <circle cx="50" cy="20" r="4" fill="#880000" />
          <path d="M50 20 Q62 32 55 42 Q52 38 50 34 Q48 30 50 20Z" fill="#CC0000" opacity="0.85" />
        </g>
      ))}
    </motion.svg>
  );
}

export default SharinganEye;
