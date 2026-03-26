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

const navItems = [
  { label: "Arena", href: "/", icon: IconSword },
  { label: "Trending", href: "/trending", icon: IconTrendingUp },
  { label: "What If", href: "/whatif", icon: IconSparkles },
  { label: "Profile", href: "/profile", icon: IconUserCircle },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Desktop Navbar */}
      <motion.nav
        animate={{ height: scrolled ? 56 : 72 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 backdrop-blur-md border-b border-mist-gray/10 bg-shadow-dark/90"
      >
        <Link href="/" className="flex items-center gap-2">
          <span className="font-brand text-xl text-sharingan-red">NewsLens</span>
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
                  active ? "text-sharingan-red" : "text-mist-gray hover:text-scroll-cream"
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{label}</span>
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-sharingan-red rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <div className="flex md:hidden items-center">
          <button
            className="p-2 text-scroll-cream"
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
            className="fixed inset-0 top-14 z-40 backdrop-blur-md md:hidden bg-shadow-dark/95"
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
                        ? "text-sharingan-red bg-sharingan-red/10"
                        : "text-scroll-cream hover:text-sharingan-red"
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
      <div className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around backdrop-blur-md border-t py-2 bg-shadow-dark/95 border-mist-gray/10">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs font-heading ${
                active ? "text-sharingan-red" : "text-mist-gray"
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
