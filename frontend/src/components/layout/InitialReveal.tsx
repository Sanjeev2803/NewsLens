"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function InitialReveal() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<"seal" | "burst" | "open">("seal");
  const { isItachi } = useTheme();

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("burst"), 1500);
    const t2 = setTimeout(() => setPhase("open"), 2100);
    const t3 = setTimeout(() => setVisible(false), 3100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {isItachi ? (
            <ItachiReveal phase={phase} />
          ) : (
            <HokageReveal phase={phase} />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ITACHI THEME — Dark gates, crows, Mangekyo Sharingan
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function ItachiReveal({ phase }: { phase: string }) {
  // Pre-generate crow positions to avoid hydration mismatch
  const crows = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        x: ((i * 137.508) % 100) - 50, // golden angle distribution
        y: ((i * 89.123) % 100) - 50,
        size: 12 + (i % 5) * 4,
        delay: (i % 8) * 0.06,
        rotation: (i * 45) % 360,
      })),
    []
  );

  return (
    <>
      {/* Pitch black background */}
      <motion.div
        className="absolute inset-0 bg-[#050508]"
        animate={phase === "open" ? { opacity: 0 } : {}}
        transition={{ duration: 1, delay: 0.2 }}
      />

      {/* Red ambient glow — Tsukuyomi moon feel */}
      <motion.div
        className="absolute inset-0"
        animate={
          phase === "seal"
            ? {
                background: [
                  "radial-gradient(circle at 50% 50%, rgba(180,0,0,0.08) 0%, transparent 60%)",
                  "radial-gradient(circle at 50% 50%, rgba(180,0,0,0.15) 0%, transparent 60%)",
                  "radial-gradient(circle at 50% 50%, rgba(180,0,0,0.08) 0%, transparent 60%)",
                ],
              }
            : {}
        }
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* ── LEFT GATE ── */}
      <motion.div
        className="absolute top-0 left-0 w-1/2 h-full z-10 overflow-hidden"
        initial={{ x: 0 }}
        animate={phase === "open" ? { x: "-105%" } : {}}
        transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] to-[#0f0a12]" />
        <div className="absolute right-0 top-0 w-[2px] h-full bg-[#E63946]/30" />

        {/* Subtle Mangekyo pattern watermark */}
        <div className="absolute right-[10%] top-[20%] opacity-[0.04]">
          <MangEkyoSymbol size={300} />
        </div>

        {/* "NEWS" vertical text */}
        <div className="absolute right-[18%] top-[22%] flex flex-col items-center gap-3">
          {"NEWS".split("").map((char, i) => (
            <motion.span
              key={i}
              className="font-brand text-4xl md:text-6xl text-[#E63946]/20 leading-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              {char}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* ── RIGHT GATE ── */}
      <motion.div
        className="absolute top-0 right-0 w-1/2 h-full z-10 overflow-hidden"
        initial={{ x: 0 }}
        animate={phase === "open" ? { x: "105%" } : {}}
        transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-[#0a0a0f] to-[#0f0a12]" />
        <div className="absolute left-0 top-0 w-[2px] h-full bg-[#E63946]/30" />

        <div className="absolute left-[10%] top-[20%] opacity-[0.04]">
          <MangEkyoSymbol size={300} />
        </div>

        <div className="absolute left-[18%] top-[22%] flex flex-col items-center gap-3">
          {"LENS".split("").map((char, i) => (
            <motion.span
              key={i}
              className="font-brand text-4xl md:text-6xl text-[#E63946]/20 leading-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
            >
              {char}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* ── CENTER: Spinning Mangekyo Sharingan ── */}
      <motion.div
        className="relative z-20"
        animate={
          phase === "seal"
            ? { rotate: [0, 360] }
            : phase === "burst"
              ? { scale: [1, 2, 0], rotate: [0, 540], opacity: [1, 1, 0] }
              : { opacity: 0 }
        }
        transition={
          phase === "seal"
            ? { duration: 3, repeat: Infinity, ease: "linear" }
            : { duration: 0.7, ease: "easeOut" }
        }
      >
        <motion.div
          animate={
            phase === "seal"
              ? { scale: [0.95, 1.05, 0.95] }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity }}
        >
          <SharinganSymbol size={140} />
        </motion.div>
      </motion.div>

      {/* ── CROWS — fly out on burst/open ── */}
      {(phase === "burst" || phase === "open") &&
        crows.map((crow) => (
          <motion.div
            key={crow.id}
            className="absolute z-30"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: crow.x * 8,
              y: crow.y * 6 - 200,
              opacity: 0,
              scale: 0.3,
              rotate: crow.rotation,
            }}
            transition={{
              duration: 1.2,
              ease: "easeOut",
              delay: crow.delay,
            }}
          >
            <CrowSilhouette size={crow.size} />
          </motion.div>
        ))}

      {/* Sharingan red ring burst */}
      {phase === "burst" && (
        <motion.div
          className="absolute rounded-full border-2 border-[#E63946] z-15"
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{ width: "250vmax", height: "250vmax", opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      )}
    </>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HOKAGE THEME — Cream gates, smooth flames, leaf symbol
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function HokageReveal({ phase }: { phase: string }) {
  return (
    <>
      <motion.div
        className="absolute inset-0 bg-[#F5E6C8]"
        animate={phase === "open" ? { opacity: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.3 }}
      />

      {/* Left gate */}
      <motion.div
        className="absolute top-0 left-0 w-1/2 h-full z-10 overflow-hidden"
        initial={{ x: 0 }}
        animate={phase === "open" ? { x: "-105%" } : {}}
        transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="absolute inset-0 bg-[#F5E6C8]" />
        <div className="absolute right-0 top-0 w-[3px] h-full bg-[#8B0000]/20" />

        {/* "NEWS" vertical */}
        <div className="absolute right-[18%] top-[18%] flex flex-col items-center gap-3">
          {"NEWS".split("").map((char, i) => (
            <motion.span
              key={i}
              className="font-brand text-5xl md:text-7xl text-[#8B0000]/20 leading-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ delay: i * 0.12, duration: 0.4 }}
            >
              {char}
            </motion.span>
          ))}
        </div>

        <SmoothFlames />
      </motion.div>

      {/* Right gate */}
      <motion.div
        className="absolute top-0 right-0 w-1/2 h-full z-10 overflow-hidden"
        initial={{ x: 0 }}
        animate={phase === "open" ? { x: "105%" } : {}}
        transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="absolute inset-0 bg-[#F5E6C8]" />
        <div className="absolute left-0 top-0 w-[3px] h-full bg-[#8B0000]/20" />

        <div className="absolute left-[18%] top-[18%] flex flex-col items-center gap-3">
          {"LENS".split("").map((char, i) => (
            <motion.span
              key={i}
              className="font-brand text-5xl md:text-7xl text-[#8B0000]/20 leading-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ delay: 0.2 + i * 0.12, duration: 0.4 }}
            >
              {char}
            </motion.span>
          ))}
        </div>

        <div className="absolute inset-0" style={{ transform: "scaleX(-1)" }}>
          <SmoothFlames />
        </div>
      </motion.div>

      {/* Center leaf symbol */}
      <motion.div
        className="relative z-20"
        animate={
          phase === "seal"
            ? { rotate: [0, 360], scale: [0.9, 1.05, 0.9] }
            : phase === "burst"
              ? { scale: [1, 1.8, 0], rotate: [0, 270], opacity: [1, 1, 0] }
              : { opacity: 0 }
        }
        transition={
          phase === "seal"
            ? { duration: 1.5, repeat: Infinity, ease: "linear" }
            : { duration: 0.6, ease: "easeOut" }
        }
      >
        <svg
          viewBox="0 0 100 100"
          className="w-28 h-28 md:w-36 md:h-36 text-[#8B0000] drop-shadow-[0_0_40px_rgba(139,0,0,0.6)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="50" cy="50" r="44" strokeWidth="2.5" />
          <path
            d="M50 10 C70 22, 84 42, 76 60 C68 78, 50 84, 36 72 C22 60, 28 38, 50 30 C66 24, 72 42, 60 54"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M50 3 L43 16 L57 16 Z" fill="currentColor" />
        </svg>
      </motion.div>

      {/* Burst ring */}
      {phase === "burst" && (
        <motion.div
          className="absolute rounded-full border-2 border-[#8B0000] z-15"
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{ width: "250vmax", height: "250vmax", opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      )}
    </>
  );
}

/* ━━━ Smooth Hokage Flame Pattern (rounded, not spiky) ━━━ */
function SmoothFlames() {
  return (
    <svg
      className="absolute bottom-0 left-0 w-full"
      style={{ height: "22%" }}
      viewBox="0 0 800 200"
      preserveAspectRatio="none"
    >
      {/* Solid red base */}
      <rect x="0" y="140" width="800" height="60" fill="#8B0000" />

      {/* Smooth rounded flame tongues — using quadratic bezier curves */}
      <path
        d="M0,200 L0,140
           Q20,140 30,100 Q40,60 55,100 Q65,140 80,140
           Q95,140 105,90 Q115,45 130,90 Q140,140 155,140
           Q170,140 180,95 Q190,50 205,95 Q215,140 230,140
           Q245,140 255,85 Q265,35 280,85 Q290,140 305,140
           Q320,140 330,95 Q340,50 355,95 Q365,140 380,140
           Q395,140 405,80 Q415,30 430,80 Q440,140 455,140
           Q470,140 480,90 Q490,45 505,90 Q515,140 530,140
           Q545,140 555,95 Q565,50 580,95 Q590,140 605,140
           Q620,140 630,85 Q640,35 655,85 Q665,140 680,140
           Q695,140 705,95 Q715,50 730,95 Q740,140 755,140
           Q770,140 780,100 Q790,60 800,100
           L800,200 Z"
        fill="#8B0000"
      />

      {/* Inner lighter flame layer */}
      <path
        d="M0,200 L0,155
           Q25,155 40,120 Q55,85 70,120 Q85,155 100,155
           Q120,155 135,115 Q150,75 165,115 Q180,155 200,155
           Q220,155 235,118 Q250,80 265,118 Q280,155 300,155
           Q320,155 335,115 Q350,75 365,115 Q380,155 400,155
           Q420,155 435,120 Q450,85 465,120 Q480,155 500,155
           Q520,155 535,115 Q550,75 565,115 Q580,155 600,155
           Q620,155 635,118 Q650,80 665,118 Q680,155 700,155
           Q720,155 735,120 Q750,85 765,120 Q780,155 800,155
           L800,200 Z"
        fill="#A01010"
        opacity="0.5"
      />
    </svg>
  );
}

/* ━━━ Mangekyo Sharingan Symbol ━━━ */
function SharinganSymbol({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className="drop-shadow-[0_0_50px_rgba(230,57,70,0.8)]"
    >
      {/* Outer ring */}
      <circle
        cx="100" cy="100" r="90"
        fill="none"
        stroke="#E63946"
        strokeWidth="3"
        opacity="0.6"
      />
      {/* Black iris */}
      <circle cx="100" cy="100" r="80" fill="#1a0a0a" />
      {/* Red ring */}
      <circle
        cx="100" cy="100" r="75"
        fill="none"
        stroke="#E63946"
        strokeWidth="2"
      />

      {/* Three Mangekyo blades — curved elegant shapes */}
      {[0, 120, 240].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 100 100)`}>
          <path
            d="M100,30 Q130,60 120,100 Q110,80 100,100 Q90,80 80,100 Q70,60 100,30"
            fill="#E63946"
            opacity="0.9"
          />
        </g>
      ))}

      {/* Center pupil */}
      <circle cx="100" cy="100" r="15" fill="#E63946" />
      <circle cx="100" cy="100" r="8" fill="#1a0a0a" />
      <circle cx="100" cy="100" r="4" fill="#E63946" opacity="0.8" />

      {/* Tomoe dots on each blade */}
      {[0, 120, 240].map((angle) => (
        <g key={`t${angle}`} transform={`rotate(${angle} 100 100)`}>
          <circle cx="100" cy="50" r="6" fill="#1a0a0a" />
          <circle cx="100" cy="50" r="3" fill="#E63946" opacity="0.5" />
        </g>
      ))}
    </svg>
  );
}

/* ━━━ Mangekyo watermark (simpler version for background) ━━━ */
function MangEkyoSymbol({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <circle cx="100" cy="100" r="90" fill="none" stroke="#E63946" strokeWidth="2" />
      {[0, 120, 240].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 100 100)`}>
          <path
            d="M100,25 Q135,60 120,100 Q100,75 80,100 Q65,60 100,25"
            fill="#E63946"
          />
        </g>
      ))}
      <circle cx="100" cy="100" r="18" fill="#E63946" />
    </svg>
  );
}

/* ━━━ Crow Silhouette ━━━ */
function CrowSilhouette({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox="0 0 50 30"
      fill="#1a1a2e"
    >
      {/* Bird body */}
      <ellipse cx="25" cy="18" rx="8" ry="5" />
      {/* Left wing */}
      <path d="M17,18 Q8,8 0,5 Q5,12 10,16 Z" />
      {/* Right wing */}
      <path d="M33,18 Q42,8 50,5 Q45,12 40,16 Z" />
      {/* Head */}
      <circle cx="25" cy="12" r="4" />
      {/* Beak */}
      <path d="M25,10 L27,8 L25,12 Z" />
    </svg>
  );
}
