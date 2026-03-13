"use client";

import { useEffect, useState, useCallback } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, ISourceOptions } from "@tsparticles/engine";

const particleOptions: ISourceOptions = {
  fullScreen: false,
  fpsLimit: 60,
  particles: {
    color: { value: "#FF6B00" },
    links: {
      color: "#FF6B00",
      distance: 150,
      enable: true,
      opacity: 0.15,
      width: 1,
    },
    move: {
      enable: true,
      speed: 0.8,
      direction: "none",
      outModes: { default: "out" },
    },
    number: {
      value: 40,
      density: { enable: true },
    },
    opacity: { value: { min: 0.1, max: 0.4 } },
    size: { value: { min: 1, max: 3 } },
  },
  detectRetina: true,
};

export default function ParticleField() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  const onLoad = useCallback(async (_container?: Container) => {
    // particles loaded
  }, []);

  if (!ready) return null;

  return (
    <Particles
      className="absolute inset-0 -z-10"
      options={particleOptions}
      particlesLoaded={onLoad}
    />
  );
}
