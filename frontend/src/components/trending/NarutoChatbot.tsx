"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SharinganEye from "./SharinganEye";
import { TTS_LANG_MAP, NARUTO_INTROS } from "./constants";

function NarutoChatbot({ lang, onSpeak }: { lang: string; onSpeak: (fn: (text: string) => void) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState("Tap the speaker on any article, dattebayo!");
  const [hasGreeted, setHasGreeted] = useState(false);

  useEffect(() => {
    window.speechSynthesis?.getVoices();
    const h = () => {};
    window.speechSynthesis?.addEventListener?.("voiceschanged", h);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", h);
  }, []);

  const findBestVoice = useCallback((langCode: string) => {
    const voices = window.speechSynthesis?.getVoices() || [];
    const prefix = langCode.split("-")[0];
    const matching = voices.filter(v => v.lang.startsWith(prefix));
    return matching.find(v => /natural|neural|premium|enhanced|wavenet|online/i.test(v.name)) || matching[0] || null;
  }, []);

  const speak = useCallback(async (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    setLastMessage(text.length > 80 ? text.slice(0, 80) + "..." : text);

    const nativeLang = TTS_LANG_MAP[lang] || "en-IN";
    const isNonEnglish = lang !== "en";

    const make = (t: string, lc: string, rate = 1.05, pitch = 1.3) => {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = lc;
      u.rate = rate;
      u.pitch = pitch;
      const v = findBestVoice(lc);
      if (v) u.voice = v;
      return u;
    };

    const intros = NARUTO_INTROS[lang] || NARUTO_INTROS.en;
    const intro = make(intros[Math.floor(Math.random() * intros.length)], nativeLang, 1.2, 1.45);
    const nativeRead = make(text, nativeLang, 1.05, 1.3);

    if (isNonEnglish) {
      try {
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 500))}&langpair=${lang}|en`);
        const data = await res.json();
        const translated = data?.responseData?.translatedText;
        if (translated && translated.toUpperCase() !== text.toUpperCase()) {
          const bridge = make("Now in English, believe it!", "en-IN", 1.15, 1.35);
          const enRead = make(translated, "en-IN", 1.0, 1.2);
          enRead.onend = () => setIsSpeaking(false);
          window.speechSynthesis.speak(intro);
          window.speechSynthesis.speak(nativeRead);
          window.speechSynthesis.speak(bridge);
          window.speechSynthesis.speak(enRead);
          return;
        }
      } catch { /* fallback */ }
    }

    nativeRead.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(intro);
    window.speechSynthesis.speak(nativeRead);
  }, [lang, findBestVoice]);

  useEffect(() => { onSpeak(speak); }, [lang, speak, onSpeak]);

  useEffect(() => {
    if (hasGreeted) return;
    let innerTimeout: ReturnType<typeof setTimeout>;
    const t = setTimeout(() => {
      setIsOpen(true);
      setHasGreeted(true);
      innerTimeout = setTimeout(() => setIsOpen(false), 4000);
    }, 3000);
    return () => { clearTimeout(t); clearTimeout(innerTimeout); };
  }, [hasGreeted]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="w-80 rounded-2xl bg-[#08080d]/95 backdrop-blur-xl border border-sharingan-red/15 shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(204,0,0,0.1)] overflow-hidden"
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          >
            <div className="px-4 py-2.5 bg-gradient-to-r from-sharingan-red/8 to-chakra-orange/8 border-b border-white/[0.04] flex items-center gap-2">
              <SharinganEye size={14} spin glow />
              <span className="text-xs font-heading font-bold text-chakra-orange">Naruto Uzumaki</span>
              <span className="text-[10px] text-mist-gray/50">Voice Ninja</span>
              <button onClick={() => setIsOpen(false)} className="ml-auto text-mist-gray/40 hover:text-white transition-colors">
                <svg viewBox="0 0 12 12" className="w-3.5 h-3.5"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" /></svg>
              </button>
            </div>
            <div className="p-4">
              <div className="flex gap-3">
                <motion.div
                  className="flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden border border-chakra-orange/30 shadow-[0_0_15px_rgba(255,165,0,0.15)] cursor-pointer"
                  animate={isSpeaking
                    ? { rotate: [0, -5, 5, -3, 0], scale: [1, 1.05, 1] }
                    : { y: [0, -2, 0] }
                  }
                  transition={isSpeaking
                    ? { duration: 0.6, repeat: Infinity }
                    : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                  }
                  whileHover={{
                    rotate: [0, -12, 15, -8, 10, 0],
                    scale: 1.15,
                    transition: { duration: 0.6 },
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/naruto-avatar.png" alt="Naruto" className="w-full h-full object-cover object-top" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-scroll-cream/90 leading-relaxed">
                    {isSpeaking ? (
                      <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                        {lastMessage}
                      </motion.span>
                    ) : lastMessage}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => speak("Dattebayo! I'm Naruto Uzumaki! Hit the speaker button on any news card. I'll read it in your language first, then translate to English! That's my ninja way, believe it!")}
                  className="px-3 py-1.5 rounded-lg bg-chakra-orange/8 border border-chakra-orange/15 text-[10px] font-heading text-chakra-orange hover:bg-chakra-orange/15 transition-colors"
                >
                  How to use?
                </button>
                <button
                  onClick={() => { window.speechSynthesis?.cancel(); setIsSpeaking(false); }}
                  className="px-3 py-1.5 rounded-lg bg-sharingan-red/8 border border-sharingan-red/15 text-[10px] font-heading text-sharingan-red hover:bg-sharingan-red/15 transition-colors"
                >
                  Stop
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB — Interactive Naruto */}
      <div className="relative group/naruto">
        {/* Hover emote bubble — pops up on hover */}
        <motion.div
          className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/naruto:opacity-100 transition-opacity duration-300"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <div className="px-2.5 py-1 rounded-lg bg-[#08080d]/90 border border-chakra-orange/20 shadow-lg whitespace-nowrap">
            <motion.span
              className="text-[10px] font-heading text-chakra-orange"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Dattebayo!
            </motion.span>
          </div>
          <div className="w-2 h-2 bg-[#08080d]/90 border-r border-b border-chakra-orange/20 rotate-45 mx-auto -mt-1" />
        </motion.div>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-16 h-16 rounded-full overflow-visible"
          whileTap={{ scale: 0.9 }}
          animate={isSpeaking
            ? { y: [0, -2, 0, -1, 0] }
            : { y: [0, -3, 0] }
          }
          transition={isSpeaking
            ? { duration: 0.5, repeat: Infinity }
            : { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }
        >
          {/* Avatar container — tilts/waves on hover */}
          <motion.div
            className="w-full h-full rounded-full overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            whileHover={{
              rotate: [0, -10, 12, -8, 5, 0],
              scale: [1, 1.1, 1.08, 1.12, 1.05, 1.1],
              transition: { duration: 0.8, ease: "easeInOut" },
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/naruto-avatar.png" alt="Naruto" className="w-full h-full object-cover object-top" />
          </motion.div>

          {/* Ring glow */}
          <div className={`absolute inset-0 rounded-full ring-2 transition-all duration-300 pointer-events-none ${
            isOpen ? "ring-chakra-orange shadow-[0_0_25px_rgba(255,165,0,0.4)]"
            : "ring-sharingan-red/40 group-hover/naruto:ring-chakra-orange group-hover/naruto:shadow-[0_0_20px_rgba(255,165,0,0.3)]"
          }`} />

          {/* Waving hand emoji — appears on hover */}
          <motion.div
            className="absolute -right-1 -bottom-1 w-6 h-6 rounded-full bg-[#08080d] border border-chakra-orange/30 flex items-center justify-center text-sm opacity-0 group-hover/naruto:opacity-100 transition-opacity duration-200 pointer-events-none"
            animate={{ rotate: [0, 20, -10, 20, -5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
          >
            <span className="text-xs">&#x1F44B;</span>
          </motion.div>

          {/* Speaking pulse rings */}
          {isSpeaking && (
            <>
              <motion.div className="absolute inset-0 rounded-full border-2 border-chakra-orange pointer-events-none" animate={{ scale: [1, 1.5], opacity: [0.5, 0] }} transition={{ duration: 1, repeat: Infinity }} />
              <motion.div className="absolute inset-0 rounded-full border border-chakra-orange/50 pointer-events-none" animate={{ scale: [1, 1.9], opacity: [0.3, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}

export default NarutoChatbot;
