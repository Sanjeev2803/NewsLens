"use client";

import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "rasengan" | "sharingan" | "seal";
  className?: string;
}

const sizes = { sm: 24, md: 40, lg: 64 };

export default function LoadingSpinner({
  size = "md",
  variant = "rasengan",
  className = "",
}: LoadingSpinnerProps) {
  const px = sizes[size];

  if (variant === "sharingan") {
    return (
      <div role="status" aria-label="Loading" className={`flex items-center justify-center ${className}`}>
        <motion.svg
          width={px}
          height={px}
          viewBox="0 0 100 100"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="50" cy="50" r="45" fill="#1a0a0a" stroke="#E63946" strokeWidth="2" />
          {[0, 120, 240].map((angle) => (
            <g key={angle} transform={`rotate(${angle} 50 50)`}>
              <circle cx="50" cy="20" r="6" fill="#E63946" />
              <circle cx="50" cy="20" r="2.5" fill="#1a0a0a" />
            </g>
          ))}
          <circle cx="50" cy="50" r="8" fill="#E63946" />
          <circle cx="50" cy="50" r="3" fill="#1a0a0a" />
        </motion.svg>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (variant === "rasengan") {
    return (
      <div role="status" aria-label="Loading" className={`flex items-center justify-center ${className}`}>
        <motion.div
          style={{ width: px, height: px }}
          className="relative rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          {/* Outer glow */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(0,180,216,0.4) 0%, rgba(0,180,216,0.1) 50%, transparent 70%)",
              boxShadow: "0 0 20px rgba(0,180,216,0.5)",
            }}
          />
          {/* Core sphere */}
          <motion.div
            className="absolute inset-[15%] rounded-full"
            style={{
              background: "radial-gradient(circle at 35% 35%, #90E0EF, #00B4D8, #0077B6)",
            }}
            animate={{ scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          {/* Spiral lines */}
          <svg className="absolute inset-0" viewBox="0 0 100 100">
            <motion.path
              d="M50,15 Q70,30 60,50 Q50,70 30,60 Q15,50 30,35 Q40,25 50,30"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="2"
              strokeLinecap="round"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "50% 50%" }}
            />
          </svg>
        </motion.div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // Default: hand seal
  return (
    <div role="status" aria-label="Loading" className={`flex items-center justify-center ${className}`}>
      <div
        style={{ width: px, height: px }}
        className="animate-hand-seal rounded-md border-2 border-chakra-orange/60 bg-chakra-orange/10"
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
