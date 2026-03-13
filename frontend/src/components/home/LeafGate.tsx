"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface LeafGateProps {
  isOpen: boolean;
  onComplete?: () => void;
}

export default function LeafGate({ isOpen, onComplete }: LeafGateProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        router.push("/trending");
        onComplete?.();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, router, onComplete]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Dark backdrop */}
          <motion.div
            className="absolute inset-0 bg-shadow-dark"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />

          {/* Left leaf half */}
          <motion.div
            className="absolute top-0 left-0 w-1/2 h-full origin-left"
            style={{ background: "linear-gradient(90deg, #0A0A0F, #0d1a0d)" }}
            initial={{ x: 0 }}
            animate={{ x: "-100%" }}
            transition={{ duration: 1.2, delay: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            {/* Left leaf SVG */}
            <svg
              className="absolute right-0 top-0 h-full"
              viewBox="0 0 100 800"
              preserveAspectRatio="none"
              style={{ width: "100px" }}
            >
              <path
                d="M100 0 L100 800 L0 800 Q60 600 40 400 Q60 200 0 0 Z"
                fill="#0d1a0d"
              />
            </svg>
            {/* Leaf vein pattern - left */}
            <div className="absolute inset-0 flex items-center justify-end pr-8">
              <svg viewBox="0 0 200 400" className="h-2/3 opacity-20">
                <path d="M200 200 L40 200" stroke="#2DC653" strokeWidth="3" fill="none" />
                <path d="M200 200 L60 80" stroke="#2DC653" strokeWidth="2" fill="none" />
                <path d="M200 200 L60 320" stroke="#2DC653" strokeWidth="2" fill="none" />
                <path d="M200 200 L80 140" stroke="#2DC653" strokeWidth="1.5" fill="none" />
                <path d="M200 200 L80 260" stroke="#2DC653" strokeWidth="1.5" fill="none" />
                <path d="M200 200 L100 50" stroke="#2DC653" strokeWidth="1" fill="none" opacity="0.6" />
                <path d="M200 200 L100 350" stroke="#2DC653" strokeWidth="1" fill="none" opacity="0.6" />
              </svg>
            </div>
          </motion.div>

          {/* Right leaf half */}
          <motion.div
            className="absolute top-0 right-0 w-1/2 h-full origin-right"
            style={{ background: "linear-gradient(270deg, #0A0A0F, #0d1a0d)" }}
            initial={{ x: 0 }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.2, delay: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            {/* Right leaf SVG */}
            <svg
              className="absolute left-0 top-0 h-full"
              viewBox="0 0 100 800"
              preserveAspectRatio="none"
              style={{ width: "100px", transform: "translateX(-99px)" }}
            >
              <path
                d="M0 0 L0 800 L100 800 Q40 600 60 400 Q40 200 100 0 Z"
                fill="#0d1a0d"
              />
            </svg>
            {/* Leaf vein pattern - right */}
            <div className="absolute inset-0 flex items-center justify-start pl-8">
              <svg viewBox="0 0 200 400" className="h-2/3 opacity-20">
                <path d="M0 200 L160 200" stroke="#2DC653" strokeWidth="3" fill="none" />
                <path d="M0 200 L140 80" stroke="#2DC653" strokeWidth="2" fill="none" />
                <path d="M0 200 L140 320" stroke="#2DC653" strokeWidth="2" fill="none" />
                <path d="M0 200 L120 140" stroke="#2DC653" strokeWidth="1.5" fill="none" />
                <path d="M0 200 L120 260" stroke="#2DC653" strokeWidth="1.5" fill="none" />
                <path d="M0 200 L100 50" stroke="#2DC653" strokeWidth="1" fill="none" opacity="0.6" />
                <path d="M0 200 L100 350" stroke="#2DC653" strokeWidth="1" fill="none" opacity="0.6" />
              </svg>
            </div>
          </motion.div>

          {/* Center seam glow */}
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full"
            style={{
              background: "linear-gradient(180deg, transparent 0%, #2DC653 20%, #2DC653 80%, transparent 100%)",
              boxShadow: "0 0 30px #2DC653, 0 0 60px #2DC65366",
            }}
            initial={{ opacity: 1, scaleX: 1 }}
            animate={{ opacity: 0, scaleX: 3 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          />

          {/* Hidden Leaf symbol in center */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2, times: [0, 0.3, 0.6, 1] }}
          >
            <svg viewBox="0 0 120 120" className="w-24 h-24 md:w-32 md:h-32">
              {/* Outer circle */}
              <circle cx="60" cy="60" r="55" fill="none" stroke="#2DC653" strokeWidth="3" opacity="0.8" />
              {/* Leaf shape */}
              <path
                d="M60 15 C40 30, 25 50, 30 70 C35 85, 50 95, 60 105 C70 95, 85 85, 90 70 C95 50, 80 30, 60 15Z"
                fill="#2DC653"
                opacity="0.3"
              />
              {/* Center spiral (Konoha symbol simplified) */}
              <path
                d="M60 35 C50 40, 42 52, 45 62 C48 72, 55 78, 60 80 C65 78, 72 72, 75 62 C78 52, 70 40, 60 35Z"
                fill="none"
                stroke="#2DC653"
                strokeWidth="2.5"
              />
              {/* Triangle notch */}
              <path d="M54 25 L60 15 L66 25" fill="none" stroke="#2DC653" strokeWidth="2" />
              {/* Spiral center */}
              <circle cx="60" cy="58" r="4" fill="#2DC653" />
            </svg>

            {/* Glow pulse behind symbol */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: "0 0 60px #2DC65366, 0 0 120px #2DC65333" }}
              animate={{
                boxShadow: [
                  "0 0 60px #2DC65366, 0 0 120px #2DC65333",
                  "0 0 100px #2DC65399, 0 0 200px #2DC65366",
                  "0 0 60px #2DC65366, 0 0 120px #2DC65333",
                ],
              }}
              transition={{ duration: 1.5, repeat: 1 }}
            />
          </motion.div>

          {/* "Entering the Arena" text */}
          <motion.p
            className="absolute bottom-1/4 text-sage-green font-heading font-bold text-lg tracking-widest uppercase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -10] }}
            transition={{ duration: 2, times: [0, 0.3, 0.7, 1], delay: 0.2 }}
          >
            Entering the Arena
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
