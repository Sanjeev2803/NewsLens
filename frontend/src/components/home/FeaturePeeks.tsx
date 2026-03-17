"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  IconSparkles,
  IconBrush,
  IconMail,
  IconArrowRight,
  IconLock,
  IconRocket,
} from "@tabler/icons-react";

/*
  Feature Sneak Peeks — Tease upcoming features
  What If, Creator Hub, Newsletter
  Clean, premium cards with "Coming Soon" or live links
*/

const FEATURES = [
  {
    title: "What If Engine",
    description: "Ask hypothetical questions about news events. AI simulates alternate outcomes and explores geopolitical ripple effects.",
    icon: IconSparkles,
    color: "#7B2FBE",
    href: "/whatif",
    status: "preview" as const,
    tags: ["AI-Powered", "Scenarios", "Analysis"],
  },
  {
    title: "Creator Hub",
    description: "Build your own news digest. Curate stories, add commentary, brand your newsletter, and grow your audience.",
    icon: IconBrush,
    color: "#FF6B00",
    href: null,
    status: "coming" as const,
    tags: ["Curation", "Branding", "Audience"],
  },
  {
    title: "Smart Newsletter",
    description: "Automated weekly briefing tailored to your interests. Creators can customize, brand, and distribute to subscribers.",
    icon: IconMail,
    color: "#00B4D8",
    href: null,
    status: "coming" as const,
    tags: ["Automated", "Weekly", "Customizable"],
  },
];

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const Icon = feature.icon;
  const isLive = feature.status === "preview";

  const card = (
    <motion.div
      className={`group relative flex flex-col rounded-2xl border overflow-hidden h-full transition-all ${
        isLive
          ? "border-white/[0.06] bg-[#0a0a10]/80 hover:border-white/[0.12] cursor-pointer"
          : "border-white/[0.04] bg-[#0a0a10]/50 cursor-default"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 + index * 0.08 }}
      whileHover={isLive ? { y: -4, scale: 1.01 } : {}}
    >
      {/* Gradient accent top */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${feature.color}40, transparent)` }} />

      <div className="p-5 flex flex-col flex-1">
        {/* Icon + Status */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${feature.color}12`, border: `1px solid ${feature.color}25` }}
          >
            <Icon size={20} style={{ color: feature.color }} />
          </div>
          {isLive ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sage-green/10 border border-sage-green/20">
              <IconRocket size={10} className="text-sage-green" />
              <span className="text-[9px] font-heading font-bold text-sage-green tracking-wider">PREVIEW</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
              <IconLock size={10} className="text-mist-gray/40" />
              <span className="text-[9px] font-heading font-bold text-mist-gray/40 tracking-wider">COMING SOON</span>
            </span>
          )}
        </div>

        {/* Title + Description */}
        <h3 className="text-base font-heading font-bold text-white mb-2">{feature.title}</h3>
        <p className="text-[12px] text-mist-gray/50 leading-relaxed mb-4 flex-1">{feature.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {feature.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md text-[9px] font-heading font-medium tracking-wider"
              style={{ backgroundColor: `${feature.color}08`, color: `${feature.color}90`, border: `1px solid ${feature.color}15` }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        {isLive ? (
          <div className="flex items-center gap-1.5 text-xs font-heading group-hover:text-white transition-colors" style={{ color: feature.color }}>
            <span>Try it now</span>
            <IconArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-heading text-mist-gray/25">
            <span>Launching soon</span>
          </div>
        )}
      </div>

      {/* Hover glow */}
      {isLive && (
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: `linear-gradient(90deg, transparent, ${feature.color}50, transparent)` }}
        />
      )}
    </motion.div>
  );

  if (feature.href) {
    return <Link href={feature.href} className="block h-full">{card}</Link>;
  }
  return card;
}

export default function FeaturePeeks() {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-amaterasu-purple/10 border border-amaterasu-purple/20 flex items-center justify-center">
          <IconRocket size={16} className="text-amaterasu-purple" />
        </div>
        <div>
          <h2 className="text-lg font-heading font-bold text-white">Coming Up</h2>
          <p className="text-[11px] text-mist-gray/40">Features in the pipeline — some already live</p>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {FEATURES.map((feature, i) => (
          <FeatureCard key={feature.title} feature={feature} index={i} />
        ))}
      </div>
    </section>
  );
}
