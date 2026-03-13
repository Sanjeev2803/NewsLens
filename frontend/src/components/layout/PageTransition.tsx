"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo, type ReactNode } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const [currentPath, setCurrentPath] = useState(pathname);

  useEffect(() => {
    if (pathname !== currentPath) {
      setIsTransitioning(true);
    }
  }, [pathname, currentPath]);

  const handleMidpoint = () => {
    setDisplayChildren(children);
    setCurrentPath(pathname);
    setTimeout(() => setIsTransitioning(false), 80);
  };

  return (
    <div className="relative">
      {displayChildren}
      <AnimatePresence>
        {isTransitioning && <TransitionOverlay onMidpoint={handleMidpoint} />}
      </AnimatePresence>
    </div>
  );
}

function TransitionOverlay({ onMidpoint }: { onMidpoint: () => void }) {
  const { isItachi } = useTheme();

  return isItachi ? (
    <CrowTransition onMidpoint={onMidpoint} />
  ) : (
    <HokageGateTransition onMidpoint={onMidpoint} />
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ITACHI — Crow dissolution transition
   Screen fills with crows, they scatter to reveal new page
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function CrowTransition({ onMidpoint }: { onMidpoint: () => void }) {
  const [phase, setPhase] = useState<"gather" | "scatter">("gather");

  const crows = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        startX: ((i * 173.13) % 120) - 60,
        startY: ((i * 97.31) % 120) - 60,
        endX: ((i * 211.7) % 160) - 80,
        endY: -100 - (i % 6) * 40,
        size: 14 + (i % 4) * 5,
        delay: (i % 10) * 0.03,
        rotation: (i * 37) % 360,
      })),
    []
  );

  return (
    <motion.div
      className="fixed inset-0 z-[9999]"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Dark overlay that gathers */}
      <motion.div
        className="absolute inset-0 bg-[#050508]"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "gather" ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        onAnimationComplete={() => {
          if (phase === "gather") {
            onMidpoint();
            setPhase("scatter");
          }
        }}
      />

      {/* Crows gathering in, then scattering out */}
      {crows.map((crow) => (
        <motion.div
          key={crow.id}
          className="absolute z-10"
          style={{ top: "50%", left: "50%" }}
          initial={{
            x: crow.startX * 5,
            y: crow.startY * 5,
            opacity: 0,
            scale: 0.5,
          }}
          animate={
            phase === "gather"
              ? {
                  x: crow.startX * 0.5,
                  y: crow.startY * 0.5,
                  opacity: 1,
                  scale: 1,
                  rotate: crow.rotation,
                }
              : {
                  x: crow.endX * 6,
                  y: crow.endY * 3,
                  opacity: 0,
                  scale: 0.3,
                  rotate: crow.rotation + 180,
                }
          }
          transition={{
            duration: phase === "gather" ? 0.4 : 0.8,
            ease: "easeOut",
            delay: crow.delay,
          }}
        >
          <svg
            width={crow.size}
            height={crow.size * 0.6}
            viewBox="0 0 50 30"
            fill="#1a1a2e"
          >
            <ellipse cx="25" cy="18" rx="8" ry="5" />
            <path d="M17,18 Q8,8 0,5 Q5,12 10,16 Z" />
            <path d="M33,18 Q42,8 50,5 Q45,12 40,16 Z" />
            <circle cx="25" cy="12" r="4" />
          </svg>
        </motion.div>
      ))}

      {/* Red Sharingan flash at midpoint */}
      {phase === "scatter" && (
        <motion.div
          className="absolute inset-0 z-5 bg-[#E63946]"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </motion.div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   HOKAGE — Cream cloak gates with smooth flames
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function HokageGateTransition({ onMidpoint }: { onMidpoint: () => void }) {
  const [phase, setPhase] = useState<"closing" | "opening">("closing");

  return (
    <motion.div
      className="fixed inset-0 z-[9999] pointer-events-none"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, delay: 0.3 }}
    >
      {/* Left gate */}
      <motion.div
        className="absolute top-0 left-0 w-1/2 h-full overflow-hidden"
        initial={{ x: "-100%" }}
        animate={{ x: phase === "closing" ? "0%" : "-100%" }}
        transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
        onAnimationComplete={() => {
          if (phase === "closing") {
            onMidpoint();
            setPhase("opening");
          }
        }}
      >
        <div className="absolute inset-0 bg-[#F5E6C8]" />
        <div className="absolute right-0 top-0 w-[2px] h-full bg-[#8B0000]/20" />
        <SmoothFlames />
      </motion.div>

      {/* Right gate */}
      <motion.div
        className="absolute top-0 right-0 w-1/2 h-full overflow-hidden"
        initial={{ x: "100%" }}
        animate={{ x: phase === "closing" ? "0%" : "100%" }}
        transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="absolute inset-0 bg-[#F5E6C8]" />
        <div className="absolute left-0 top-0 w-[2px] h-full bg-[#8B0000]/20" />
        <div className="absolute inset-0" style={{ transform: "scaleX(-1)" }}>
          <SmoothFlames />
        </div>
      </motion.div>
    </motion.div>
  );
}

function SmoothFlames() {
  return (
    <svg
      className="absolute bottom-0 left-0 w-full"
      style={{ height: "22%" }}
      viewBox="0 0 800 200"
      preserveAspectRatio="none"
    >
      <rect x="0" y="140" width="800" height="60" fill="#8B0000" />
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
