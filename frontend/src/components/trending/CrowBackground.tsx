"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SharinganEye from "./SharinganEye";

function CrowBackground() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const crows = [
    { top: "10%", delay: 0, size: 28, dur: 24, opacity: 0.05 },
    { top: "35%", delay: 4, size: 22, dur: 30, opacity: 0.04 },
    { top: "60%", delay: 8, size: 30, dur: 22, opacity: 0.05 },
    { top: "80%", delay: 2, size: 20, dur: 28, opacity: 0.04 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {crows.map((c, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ top: c.top, left: "-80px", opacity: c.opacity }}
          animate={{
            x: ["0vw", "105vw"],
            y: [0, Math.sin(i * 1.3) * 50, Math.cos(i * 0.8) * 30, 0],
          }}
          transition={{
            x: { duration: c.dur, repeat: Infinity, ease: "linear", delay: c.delay },
            y: { duration: c.dur / 2, repeat: Infinity, ease: "easeInOut", delay: c.delay },
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/crow.png" alt="" width={c.size} height={c.size * 0.6} style={{ filter: "brightness(0)" }} draggable={false} />
        </motion.div>
      ))}

      {/* Background Sharingan — static, no spinning to save memory */}
      <div className="absolute top-[10%] right-[5%] opacity-[0.015]">
        <SharinganEye size={120} />
      </div>
    </div>
  );
}

export default CrowBackground;
