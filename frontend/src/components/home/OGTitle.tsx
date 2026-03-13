"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";

/*
  Kalki 2898 AD — Cinematic Title Forge
  TIME-TRAVELING TYPOGRAPHY

  Each letter stays in its horizontal position the entire time.
  The CHARACTER inside each position flickers through scripts,
  gradually slowing down until it stabilizes into the final Latin letter.

  NO fragments flying in. The letters morph IN PLACE.

  STAGES (5 seconds total):
  1 "void"       (0–0.5s)    Dark cosmic void. Dust drifts.
  2 "brahmi"     (0.5–1.3s)  Ancient Brahmi transliteration flickers in.
  3 "devanagari" (1.3–2.1s)  Morphs to Devanagari transliteration.
  4 "japanese"   (2.1–3.0s)  Transforms into Japanese Katakana transliteration.
  5 "stabilize"  (3.0–3.8s)  Flicker slows down. Latin chars lock left-to-right.
  6 "engrave"    (3.8–4.5s)  Energy lines trace through letter edges.
  7 "lock"       (4.5–5.0s)  Impact flash. Dust burst. Final metallic title.
*/

const TITLE = "NewsLens";

type Stage = "void" | "brahmi" | "devanagari" | "japanese" | "stabilize" | "engrave" | "lock";

const STAGES: Stage[] = ["void", "brahmi", "devanagari", "japanese", "stabilize", "engrave", "lock"];

// ── Per-letter transliterations of "NewsLens" across scripts ──
// N(0) e(1) w(2) s(3) L(4) e(5) n(6) s(7)
const SCRIPT_MAP: Record<string, string[]> = {
  brahmi:     ["𑀦", "𑀏", "𑀯", "𑀲", "𑀮", "𑀏", "𑀦", "𑀲"],
  devanagari: ["न",  "ए",  "व",  "स",  "ल",  "ए",  "न",  "स"],
  japanese:   ["ニ",  "ュ",  "ー",  "ズ",  "レ",  "ン",  "ズ",  "ス"],
  hybrid:     ["Ŋ",  "Ɛ",  "Ψ",  "Σ",  "Λ",  "Ɛ",  "Ŋ",  "Σ"],
  latin:      ["N",  "e",  "w",  "s",  "L",  "e",  "n",  "s"],
};

// Glitch characters from same script (for temporal noise)
const GLITCH_POOL: Record<string, string[]> = {
  brahmi:     ["𑀅", "𑀓", "𑀔", "𑀣", "𑀭", "𑀱", "𑀳", "𑀇"],
  devanagari: ["क",  "ग",  "ज",  "ध",  "प",  "म",  "य",  "श"],
  japanese:   ["ア",  "カ",  "サ",  "タ",  "ナ",  "ハ",  "マ",  "ヤ"],
};

// Font families for each stage
const STAGE_FONTS: Record<string, string> = {
  void: "'Cinzel', serif",
  brahmi: "system-ui, sans-serif",
  devanagari: "'Noto Serif Devanagari', serif",
  japanese: "'Noto Sans JP', sans-serif",
  hybrid: "'Rajdhani', sans-serif",
  stabilize: "'Cinzel', serif",
  engrave: "'Cinzel', serif",
  lock: "'Cinzel', serif",
};

// ── Consistent color palette ──
const METAL_GRADIENT = "linear-gradient(170deg, #8B6914, #C4A35A, #FFD700, #C4A35A, #8B6914)";
const METAL_GRADIENT_BRIGHT = "linear-gradient(170deg, #8B7500, #FFD700, #FFA500, #DAA520, #B8860B)";
const GLOW_COLOR = "rgba(255,215,0,0.5)";
const ACCENT_BLUE = "#00B4D8";
const ACCENT_GOLD = "#FFD700";

export default function OGTitle() {
  const [stage, setStage] = useState<Stage>("void");

  useEffect(() => {
    const schedule: [Stage, number][] = [
      ["brahmi", 500],
      ["devanagari", 1300],
      ["japanese", 2100],
      ["stabilize", 3000],
      ["engrave", 3800],
      ["lock", 4500],
    ];
    const timers = schedule.map(([s, ms]) => setTimeout(() => setStage(s), ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  const stageIdx = STAGES.indexOf(stage);

  return (
    <motion.div
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{ height: "clamp(150px, 22vw, 260px)" }}
      animate={{ scale: stageIdx >= 6 ? 1.06 : 1 + stageIdx * 0.006 }}
      transition={{ duration: 2.5, ease: "easeOut" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,0,20,0.12)] to-transparent" />

      <VolumetricBeams intensity={stageIdx >= 5 ? 1 : stageIdx >= 2 ? 0.3 : 0.1} />
      <CosmicDust />

      {/* Particles during script phases */}
      {stageIdx >= 1 && stageIdx <= 4 && <AttractParticles />}

      {/* Title — letters stay in place, characters morph through scripts */}
      <div className="relative z-10 flex items-baseline justify-center tracking-[0.04em]">
        {TITLE.split("").map((char, i) => (
          <MorphingLetter
            key={i}
            finalChar={char}
            index={i}
            stage={stage}
            stageIdx={stageIdx}
          />
        ))}
      </div>

      {stage === "engrave" && <EngraveTrace />}
      {stage === "lock" && <LockImpact />}

      {/* Post-lock breathing glow */}
      {stageIdx >= 6 && (
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none"
          animate={{ opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.04) 0%, rgba(255,215,0,0.01) 30%, transparent 60%)",
          }}
        />
      )}
    </motion.div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MORPHING LETTER

   The letter stays in its horizontal position the entire time.
   Only the displayed CHARACTER changes — flickering through
   Brahmi → Devanagari → Telugu → stabilize → Latin.

   During "stabilize", the flicker SLOWS DOWN and increasingly
   shows the Latin char, until it locks left-to-right.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function MorphingLetter({
  finalChar,
  index,
  stage,
  stageIdx,
}: {
  finalChar: string;
  index: number;
  stage: Stage;
  stageIdx: number;
}) {
  const [displayChar, setDisplayChar] = useState("");
  const [displayFont, setDisplayFont] = useState(STAGE_FONTS.brahmi);
  const [isLocked, setIsLocked] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getCorrectChar = useCallback((s: string): string => {
    const map = SCRIPT_MAP[s];
    return map ? map[index] : finalChar;
  }, [index, finalChar]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Void — nothing visible
    if (stage === "void") {
      setDisplayChar("");
      setIsLocked(false);
      return;
    }

    // Engrave / Lock — final Latin, no flickering
    if (stage === "engrave" || stage === "lock") {
      setDisplayChar(finalChar);
      setDisplayFont(STAGE_FONTS.lock);
      setIsLocked(true);
      return;
    }

    // Stabilize — flicker slows down, lock left-to-right
    if (stage === "stabilize") {
      setDisplayFont(STAGE_FONTS.stabilize);

      // Each letter locks after a staggered delay (left to right)
      const lockDelay = index * 60; // 60ms apart, so N locks first, s locks last
      let startTime = Date.now();

      // Start with a mix — fast at first, slowing down
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;

        if (elapsed > lockDelay + 200) {
          // This letter has locked
          setDisplayChar(finalChar);
          setDisplayFont(STAGE_FONTS.lock);
          setIsLocked(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        if (elapsed > lockDelay) {
          // In the locking window — mostly Latin with rare glitches
          setDisplayChar(Math.random() < 0.85 ? finalChar : getCorrectChar("hybrid"));
          setDisplayFont(Math.random() < 0.85 ? STAGE_FONTS.lock : STAGE_FONTS.hybrid);
          return;
        }

        // Before this letter's lock time — still flickering but slowing
        const progress = elapsed / (lockDelay + 200);
        const latinChance = 0.3 + progress * 0.5; // increasingly Latin

        if (Math.random() < latinChance) {
          setDisplayChar(finalChar);
          setDisplayFont(STAGE_FONTS.lock);
        } else {
          // Random script flash
          const scripts = ["japanese", "devanagari", "hybrid"];
          const s = scripts[Math.floor(Math.random() * scripts.length)];
          setDisplayChar(getCorrectChar(s));
          setDisplayFont(STAGE_FONTS[s]);
        }
      }, 50); // Fast stabilize interval

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }

    // Script stages: brahmi / devanagari / japanese
    const scriptKey = stage as string;
    const correctChar = getCorrectChar(scriptKey);
    const font = STAGE_FONTS[stage];
    const glitchChars = GLITCH_POOL[scriptKey] || [];

    // Stagger appearance per letter
    const startDelay = index * 30;

    const timeout = setTimeout(() => {
      setDisplayChar(correctChar);
      setDisplayFont(font);
      setIsLocked(false);

      // Flicker speed — slower than before
      const flickerSpeed = stage === "brahmi" ? 80
        : stage === "devanagari" ? 65
        : 55; // japanese

      intervalRef.current = setInterval(() => {
        const roll = Math.random();

        if (roll < 0.65) {
          // Correct transliterated char
          setDisplayChar(correctChar);
          setDisplayFont(font);
        } else if (roll < 0.85) {
          // Same-script glitch
          setDisplayChar(glitchChars[Math.floor(Math.random() * glitchChars.length)] || correctChar);
          setDisplayFont(font);
        } else {
          // Cross-script temporal overlap
          const otherScripts = ["brahmi", "devanagari", "japanese"].filter(s => s !== scriptKey);
          const otherScript = otherScripts[Math.floor(Math.random() * otherScripts.length)];
          setDisplayChar(SCRIPT_MAP[otherScript]?.[index] || correctChar);
          setDisplayFont(STAGE_FONTS[otherScript] || font);
        }
      }, flickerSpeed);
    }, startDelay);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [stage, index, finalChar, getCorrectChar]);

  const fontClasses = "text-5xl md:text-7xl lg:text-[6rem] xl:text-[7rem] inline-block";
  const showLetter = stageIdx >= 1; // visible from brahmi onwards
  const isFullyLocked = stageIdx >= 5 || isLocked;

  return (
    <span className="relative inline-block" style={{ lineHeight: 1 }}>
      {/* The letter — always in the same position, only the character changes */}
      <motion.span
        className={`${fontClasses} relative`}
        style={{
          fontFamily: displayFont,
          fontWeight: 500,
          backgroundImage: isFullyLocked ? METAL_GRADIENT_BRIGHT : METAL_GRADIENT,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          filter: isFullyLocked
            ? `drop-shadow(0 0 12px ${GLOW_COLOR}) drop-shadow(0 0 4px rgba(0,180,216,0.4)) drop-shadow(0 3px 8px rgba(0,0,0,0.9))`
            : `drop-shadow(0 0 8px ${GLOW_COLOR}) drop-shadow(0 2px 4px rgba(0,0,0,0.9))`,
          transition: "filter 0.4s ease",
          // Keep consistent width so letters don't jump around
          minWidth: "0.6em",
          textAlign: "center",
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{
          opacity: showLetter ? 1 : 0,
          y: showLetter ? 0 : 12,
          // Subtle jitter during flickering, stops when locked
          x: isFullyLocked ? 0 : undefined,
        }}
        transition={{
          opacity: { duration: 0.5, delay: index * 0.08 },
          y: { duration: 0.5, delay: index * 0.08 },
        }}
      >
        {displayChar || "\u00A0"}

        {/* Horizontal scan-line glitch — only during script flickering */}
        {showLetter && !isFullyLocked && (
          <motion.span
            className="absolute inset-0 pointer-events-none overflow-hidden"
            style={{ mixBlendMode: "screen" }}
            animate={{ opacity: [0, 0.25, 0, 0.2, 0] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            <span
              className="absolute w-full"
              style={{
                height: "2px",
                top: `${30 + (index * 17) % 40}%`,
                background: "rgba(255,215,0,0.35)",
              }}
            />
          </motion.span>
        )}

        {/* Energy shimmer after locking */}
        {isFullyLocked && (
          <motion.span
            className={`absolute inset-0 pointer-events-none ${fontClasses}`}
            style={{
              fontFamily: "'Cinzel', serif",
              fontWeight: 500,
              backgroundImage: `linear-gradient(135deg, ${ACCENT_BLUE}, ${ACCENT_GOLD}, ${ACCENT_BLUE}, ${ACCENT_GOLD})`,
              backgroundSize: "300% 300%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              minWidth: "0.6em",
              textAlign: "center",
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: stageIdx >= 6 ? [0.08, 0.2, 0.08] : [0, 0.5, 0.2],
              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            }}
            transition={
              stageIdx >= 6
                ? { duration: 3, repeat: Infinity, delay: index * 0.25, ease: "easeInOut" }
                : { duration: 0.6, delay: index * 0.05 }
            }
            aria-hidden="true"
          >
            {finalChar}
          </motion.span>
        )}

        {/* Lock flash per letter — small burst when each letter stabilizes */}
        {isLocked && stage === "stabilize" && (
          <motion.span
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(255,215,0,0.5) 0%, transparent 70%)`,
            }}
            initial={{ opacity: 1, scale: 1.3 }}
            animate={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.span>

      {/* Ghost outline during early stage */}
      {stageIdx >= 1 && stageIdx <= 2 && (
        <motion.span
          className={`absolute inset-0 ${fontClasses} pointer-events-none`}
          style={{
            fontFamily: "'Cinzel', serif",
            fontWeight: 500,
            WebkitTextStroke: "0.5px rgba(255,215,0,0.1)",
            WebkitTextFillColor: "transparent",
            filter: "blur(3px)",
            minWidth: "0.6em",
            textAlign: "center",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.15, 0.08, 0.2, 0.1] }}
          transition={{ duration: 2, ease: "easeInOut" }}
          aria-hidden="true"
        >
          {finalChar}
        </motion.span>
      )}
    </span>
  );
}

/* ━━━ Attract particles ━━━ */
function AttractParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 60 }).map((_, i) => {
        const targetLetterIdx = i % TITLE.length;
        const targetX = 20 + (targetLetterIdx / (TITLE.length - 1)) * 60;
        const targetY = 42 + ((i * 7) % 18) - 9;
        const edge = i % 4;
        const startX = edge === 0 ? -15 : edge === 1 ? 115 : ((i * 47) % 100);
        const startY = edge === 2 ? -15 : edge === 3 ? 115 : ((i * 31) % 100);
        return {
          id: i, startX, startY, targetX, targetY,
          size: 1.5 + (i % 3) * 0.8,
          color: i % 4 === 0 ? ACCENT_BLUE : i % 4 === 1 ? ACCENT_GOLD : i % 4 === 2 ? "#FFA500" : "#C4A35A",
          glow: i % 3 < 2,
          delay: (i % 18) * 0.1,
        };
      }),
    []
  );

  return (
    <div className="absolute inset-0 z-5 pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size, height: p.size,
            backgroundColor: p.color,
            left: `${p.startX}%`,
            top: `${p.startY}%`,
            boxShadow: p.glow ? `0 0 ${p.size * 6}px ${p.color}` : "none",
          }}
          animate={{
            left: `${p.targetX}%`,
            top: `${p.targetY}%`,
            opacity: [0, 0.8, 0.9, 0],
            scale: [0.3, 1.3, 0.6, 0],
          }}
          transition={{
            duration: 2.5,
            delay: p.delay,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      ))}

      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 48%, rgba(255,215,0,0.12) 0%, transparent 50%)",
        }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ━━━ Energy engrave ━━━ */
function EngraveTrace() {
  return (
    <>
      {/* Blue energy dot — left to right */}
      <motion.div
        className="absolute z-20 pointer-events-none"
        style={{
          width: 5, height: 5, borderRadius: "50%",
          backgroundColor: ACCENT_BLUE,
          boxShadow: `0 0 18px 6px rgba(0,180,216,0.7), 0 0 50px 12px rgba(0,180,216,0.25)`,
          top: "35%",
        }}
        initial={{ left: "15%", opacity: 0 }}
        animate={{
          left: ["15%", "85%"],
          opacity: [0, 1, 1, 1, 0],
          top: ["35%", "38%", "33%", "40%", "35%"],
        }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      />
      <motion.div
        className="absolute z-19 pointer-events-none"
        style={{
          height: 2,
          background: `linear-gradient(90deg, transparent, ${ACCENT_BLUE}, rgba(0,180,216,0.7), transparent)`,
          boxShadow: "0 0 10px rgba(0,180,216,0.4)",
          top: "37%",
        }}
        initial={{ left: "15%", width: 0, opacity: 0 }}
        animate={{
          width: ["0%", "70%", "70%", "0%"],
          opacity: [0, 1, 0.8, 0],
          left: ["15%", "15%", "15%", "85%"],
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />

      {/* Gold energy dot — right to left */}
      <motion.div
        className="absolute z-20 pointer-events-none"
        style={{
          width: 4, height: 4, borderRadius: "50%",
          backgroundColor: ACCENT_GOLD,
          boxShadow: "0 0 14px 5px rgba(255,215,0,0.7), 0 0 40px 10px rgba(255,215,0,0.25)",
          top: "62%",
        }}
        initial={{ left: "85%", opacity: 0 }}
        animate={{
          left: ["85%", "15%"],
          opacity: [0, 1, 1, 1, 0],
          top: ["62%", "58%", "65%", "56%", "60%"],
        }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: 0.25 }}
      />
      <motion.div
        className="absolute z-19 pointer-events-none"
        style={{
          height: 1.5,
          background: `linear-gradient(270deg, transparent, ${ACCENT_GOLD}, rgba(255,215,0,0.6), transparent)`,
          boxShadow: "0 0 8px rgba(255,215,0,0.3)",
          top: "61%",
        }}
        initial={{ right: "15%", width: 0, opacity: 0 }}
        animate={{
          width: ["0%", "70%", "70%", "0%"],
          opacity: [0, 1, 0.7, 0],
          right: ["15%", "15%", "15%", "85%"],
        }}
        transition={{ duration: 0.9, ease: "easeInOut", delay: 0.3 }}
      />

      {/* Engrave sparks */}
      {Array.from({ length: 14 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute z-20 rounded-full pointer-events-none"
          style={{
            width: 2.5, height: 2.5,
            backgroundColor: i % 2 === 0 ? ACCENT_BLUE : ACCENT_GOLD,
            boxShadow: `0 0 6px ${i % 2 === 0 ? ACCENT_BLUE : ACCENT_GOLD}`,
            top: `${34 + (i % 3) * 14}%`,
            left: `${17 + i * 5}%`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 2.5, 0], y: [0, -10 + (i % 2 === 0 ? -6 : 6)] }}
          transition={{ duration: 0.4, delay: i * 0.07, ease: "easeOut" }}
        />
      ))}
    </>
  );
}

/* ━━━ Lock impact ━━━ */
function LockImpact() {
  return (
    <>
      <motion.div
        className="absolute inset-0 z-30 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 48%, rgba(255,215,0,0.4) 0%, rgba(0,180,216,0.15) 35%, transparent 65%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.5 }}
      />

      {Array.from({ length: 32 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 32;
        const dist = 60 + (i % 6) * 22;
        const isBlue = i % 4 === 0;
        const isGold = i % 4 === 1;
        return (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 rounded-full z-20 pointer-events-none"
            style={{
              width: 1.5 + (i % 4), height: 1.5 + (i % 4),
              backgroundColor: isBlue ? ACCENT_BLUE : isGold ? ACCENT_GOLD : "#C4A35A",
              boxShadow: isBlue || isGold ? `0 0 6px ${isBlue ? ACCENT_BLUE : ACCENT_GOLD}` : "none",
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1.5 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * (dist * 0.5), opacity: 0, scale: 0 }}
            transition={{ duration: 0.7, delay: i * 0.008, ease: "easeOut" }}
          />
        );
      })}

      <motion.div
        className="absolute top-[48%] left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        style={{
          height: 1.5,
          background: `linear-gradient(90deg, transparent 0%, rgba(0,180,216,0.5) 20%, rgba(255,215,0,0.8) 50%, rgba(0,180,216,0.5) 80%, transparent 100%)`,
        }}
        initial={{ width: 0, opacity: 1 }}
        animate={{ width: "90vw", opacity: [1, 0.8, 0] }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </>
  );
}

/* ━━━ Volumetric beams ━━━ */
function VolumetricBeams({ intensity }: { intensity: number }) {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {[
        { left: "-5%", rot: "18deg", color: "0,180,216" },
        { left: "38%", rot: "0deg", color: "255,215,0" },
        { left: "72%", rot: "-15deg", color: "255,165,0" },
      ].map((b, i) => (
        <motion.div
          key={i}
          className="absolute -top-[30%] w-[22%] h-[160%]"
          style={{
            left: b.left,
            background: `linear-gradient(${b.rot}, transparent 25%, rgba(${b.color},${0.03 * intensity}) 50%, transparent 75%)`,
            transform: `rotate(${b.rot})`,
          }}
          animate={{ opacity: [0.3 * intensity, 0.8 * intensity, 0.3 * intensity] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
        />
      ))}
    </div>
  );
}

/* ━━━ Cosmic dust ━━━ */
function CosmicDust() {
  const p = useMemo(
    () =>
      Array.from({ length: 30 }).map((_, i) => ({
        x: (i * 41.3) % 100,
        y: (i * 29.7) % 100,
        s: 1 + (i % 3) * 0.7,
        c: i % 5 === 0 ? ACCENT_BLUE : i % 5 === 1 ? ACCENT_GOLD : i % 5 === 2 ? "#C4A35A" : "#5A5A6A",
        g: i % 5 < 2,
        d: 5 + (i % 5) * 2,
        dl: (i % 7) * 0.6,
      })),
    []
  );

  return (
    <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
      {p.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: dot.s, height: dot.s,
            backgroundColor: dot.c,
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            boxShadow: dot.g ? `0 0 ${dot.s * 4}px ${dot.c}` : "none",
          }}
          animate={{
            y: [0, -15 - (i % 10), -30],
            opacity: [0, dot.g ? 0.5 : 0.2, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{ duration: dot.d, delay: dot.dl, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
