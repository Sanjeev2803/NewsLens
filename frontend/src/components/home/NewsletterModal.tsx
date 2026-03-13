"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";
import Button from "@/components/ui/Button";

/*
  Newsletter Creation Modal
  Topic selection, urgency threshold slider, email input.
*/

const TOPICS = ["Politics", "Technology", "World", "Science", "Business", "Sports", "Health", "Environment"];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NewsletterModal({ open, onClose }: Props) {
  const { isItachi } = useTheme();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [threshold, setThreshold] = useState(3);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "summoning" | "success">("idle");

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : prev.length < 5 ? [...prev, topic] : prev
    );
  };

  const handleSubmit = () => {
    if (!email || selectedTopics.length === 0) return;
    setStatus("summoning");
    // Simulate API call
    setTimeout(() => setStatus("success"), 1200);
  };

  const bgOverlay = isItachi ? "bg-shadow-dark/80" : "bg-[#1a0a0a]/60";
  const modalBg = isItachi ? "bg-ink-black border-mist-gray/15" : "bg-[#FFF8EE] border-[#8B0000]/15";
  const textPrimary = isItachi ? "text-scroll-cream" : "text-[#1a0a0a]";
  const textSecondary = isItachi ? "text-mist-gray" : "text-[#6a5a4a]";
  const inputBg = isItachi
    ? "bg-shadow-dark border-mist-gray/20 text-scroll-cream placeholder-mist-gray/40"
    : "bg-white border-[#8B0000]/15 text-[#1a0a0a] placeholder-[#6a5a4a]/50";

  const thresholdColors = ["#2DC653", "#7BC65F", "#FFB020", "#E67E22", "#E63946"];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${bgOverlay}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`w-full max-w-lg rounded-xl border p-6 md:p-8 ${modalBg}`}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {status === "success" ? (
              <div className="text-center py-8">
                <motion.div
                  className="text-5xl mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  ✅
                </motion.div>
                <h3 className={`text-xl font-heading font-bold mb-2 ${textPrimary}`}>
                  Summoning Complete
                </h3>
                <p className={`text-sm mb-6 ${textSecondary}`}>
                  Your newsletter scroll has been activated. Check your email for confirmation.
                </p>
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
              </div>
            ) : (
              <>
                <h3 className={`text-xl font-heading font-bold mb-1 ${textPrimary}`}>
                  Create Your Scroll
                </h3>
                <p className={`text-sm mb-6 ${textSecondary}`}>
                  Choose topics and urgency level for your personalized briefing.
                </p>

                {/* Topic selection */}
                <div className="mb-6">
                  <label className={`text-xs font-heading font-semibold mb-2 block ${textSecondary}`}>
                    Topics (select up to 5)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map((topic) => {
                      const selected = selectedTopics.includes(topic);
                      return (
                        <button
                          key={topic}
                          onClick={() => toggleTopic(topic)}
                          className={`px-3 py-1.5 rounded-md text-xs font-heading font-medium transition-all border ${
                            selected
                              ? isItachi
                                ? "bg-sharingan-red/20 border-sharingan-red/40 text-sharingan-red shadow-[0_0_8px_rgba(230,57,70,0.2)]"
                                : "bg-chakra-orange/20 border-chakra-orange/40 text-chakra-orange shadow-[0_0_8px_rgba(255,107,0,0.2)]"
                              : isItachi
                                ? "border-mist-gray/15 text-mist-gray hover:border-mist-gray/30"
                                : "border-[#8B0000]/10 text-[#6a5a4a] hover:border-[#8B0000]/25"
                          }`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Urgency threshold slider */}
                <div className="mb-6">
                  <label className={`text-xs font-heading font-semibold mb-2 block ${textSecondary}`}>
                    Chakra Threshold: {threshold}
                    <span className={`ml-2 font-normal ${textSecondary}`}>
                      ({threshold === 1 ? "All news" : threshold === 5 ? "Breaking only" : `Priority ${threshold}+`})
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(90deg, ${thresholdColors[threshold - 1]} ${(threshold / 5) * 100}%, rgba(139,139,163,0.2) ${(threshold / 5) * 100}%)`,
                        accentColor: thresholdColors[threshold - 1],
                      }}
                    />
                    <div className="flex justify-between mt-1">
                      <span className={`text-[10px] ${textSecondary}`}>All</span>
                      <span className={`text-[10px] ${textSecondary}`}>Breaking</span>
                    </div>
                  </div>
                </div>

                {/* Email input */}
                <div className="mb-6">
                  <label className={`text-xs font-heading font-semibold mb-2 block ${textSecondary}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ninja@village.com"
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm font-body outline-none transition-all focus:ring-2 focus:ring-chakra-orange/50 ${inputBg}`}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!email || selectedTopics.length === 0 || status === "summoning"}
                    className="flex-1"
                  >
                    {status === "summoning" ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-block"
                      >
                        ◎
                      </motion.span>
                    ) : (
                      "Activate Summoning"
                    )}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
