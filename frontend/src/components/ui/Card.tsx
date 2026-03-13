"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  variant?: "default" | "featured" | "breaking";
  className?: string;
  onClick?: () => void;
}

const variantStyles = {
  default: "border-mist-gray/20 hover:border-chakra-orange/40",
  featured: "border-chakra-orange/40 shadow-glow",
  breaking: "border-sharingan-red/60 shadow-glow-breaking",
};

export default function Card({
  children,
  variant = "default",
  className = "",
  onClick,
}: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`rounded-lg border bg-ink-black/80 backdrop-blur-sm p-4 transition-shadow ${variantStyles[variant]} ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}
