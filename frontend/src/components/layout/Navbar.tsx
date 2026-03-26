"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconSword,
  IconTrendingUp,
  IconSparkles,
  IconUserCircle,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";
import { useTheme } from "@/components/providers/ThemeProvider";

const navItems = [
  { label: "Arena", href: "/", icon: IconSword },
  { label: "Trending", href: "/trending", icon: IconTrendingUp },
  { label: "What If", href: "/whatif", icon: IconSparkles },
  { label: "Profile", href: "/profile", icon: IconUserCircle },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isItachi, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const accent = isItachi ? "text-sharingan-red" : "text-chakra-orange";
  const accentBg = isItachi ? "bg-sharingan-red" : "bg-chakra-orange";
  const navBg = isItachi
    ? "bg-shadow-dark/90"
    : "bg-[#F5E6C8]/90";
  const textBase = isItachi ? "text-mist-gray" : "text-[#4a3520]";
  const textActive = isItachi ? "text-scroll-cream" : "text-[#1a0a0a]";

  return (
    <>
      {/* Desktop Navbar */}
      <motion.nav
        animate={{ height: scrolled ? 56 : 72 }}
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 backdrop-blur-md border-b ${
          isItachi ? "border-mist-gray/10" : "border-[#8B0000]/10"
        } ${navBg}`}
      >
        <Link href="/" className="flex items-center gap-2">
          <span className={`font-brand text-xl ${accent}`}>
            NewsLens
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-heading font-medium transition-colors ${
                  active
                    ? accent
                    : `${textBase} hover:${textActive}`
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className={`absolute bottom-0 left-2 right-2 h-0.5 ${accentBg} rounded-full`}
                  />
                )}
              </Link>
            );
          })}

          {/* Theme toggle — Sharingan / Leaf */}
          <button
            onClick={toggleTheme}
            className={`ml-3 p-2 rounded-md transition-colors ${textBase} hover:${textActive}`}
            aria-label={isItachi ? "Switch to Hokage theme" : "Switch to Itachi theme"}
            title={isItachi ? "Hokage Mode" : "Itachi Mode"}
          >
            <motion.div
              animate={{ rotate: isItachi ? 0 : 360 }}
              transition={{ duration: 0.5 }}
            >
              {isItachi ? (
                /* Sharingan icon */
                <svg width="22" height="22" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="#1a0a0a" stroke="#E63946" strokeWidth="4" />
                  {[0, 120, 240].map((a) => (
                    <g key={a} transform={`rotate(${a} 50 50)`}>
                      <circle cx="50" cy="22" r="7" fill="#E63946" />
                    </g>
                  ))}
                  <circle cx="50" cy="50" r="10" fill="#E63946" />
                  <circle cx="50" cy="50" r="4" fill="#1a0a0a" />
                </svg>
              ) : (
                /* Leaf icon */
                <svg width="22" height="22" viewBox="0 0 100 100" fill="none" stroke="#8B0000" strokeWidth="4">
                  <circle cx="50" cy="50" r="40" />
                  <path
                    d="M50 14 C66 24, 78 40, 72 56 C66 72, 50 76, 38 66 C26 54, 32 38, 50 32 C62 28, 66 40, 58 50"
                    strokeLinecap="round"
                  />
                  <path d="M50 6 L44 17 L56 17 Z" fill="#8B0000" />
                </svg>
              )}
            </motion.div>
          </button>
        </div>

        {/* Mobile: theme toggle + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`p-2 ${textBase}`}
            aria-label="Toggle theme"
          >
            {isItachi ? (
              <svg width="20" height="20" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="#1a0a0a" stroke="#E63946" strokeWidth="4" />
                {[0, 120, 240].map((a) => (
                  <g key={a} transform={`rotate(${a} 50 50)`}>
                    <circle cx="50" cy="22" r="7" fill="#E63946" />
                  </g>
                ))}
                <circle cx="50" cy="50" r="10" fill="#E63946" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 100 100" fill="none" stroke="#8B0000" strokeWidth="4">
                <circle cx="50" cy="50" r="40" />
                <path d="M50 14 C66 24, 78 40, 72 56 C66 72, 50 76, 38 66" strokeLinecap="round" />
                <path d="M50 6 L44 17 L56 17 Z" fill="#8B0000" />
              </svg>
            )}
          </button>
          <button
            className={`p-2 ${isItachi ? "text-scroll-cream" : "text-[#1a0a0a]"}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <IconX size={24} stroke={1.5} /> : <IconMenu2 size={24} stroke={1.5} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed inset-0 top-14 z-40 backdrop-blur-md md:hidden ${
              isItachi ? "bg-shadow-dark/95" : "bg-[#F5E6C8]/95"
            }`}
          >
            <div className="flex flex-col items-center gap-2 pt-8">
              {navItems.map(({ label, href, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-6 py-3 text-lg font-heading font-semibold rounded-md transition-colors ${
                      active
                        ? `${accent} ${isItachi ? "bg-sharingan-red/10" : "bg-[#8B0000]/10"}`
                        : `${isItachi ? "text-scroll-cream" : "text-[#1a0a0a]"} hover:${accent}`
                    }`}
                  >
                    <Icon size={22} aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom tab bar on mobile */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around backdrop-blur-md border-t py-2 ${
          isItachi
            ? "bg-shadow-dark/95 border-mist-gray/10"
            : "bg-[#F5E6C8]/95 border-[#8B0000]/10"
        }`}
      >
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs font-heading ${
                active ? accent : textBase
              }`}
              aria-label={label}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
