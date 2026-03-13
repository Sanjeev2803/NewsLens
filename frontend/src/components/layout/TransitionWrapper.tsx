"use client";

import { type ReactNode } from "react";
import ThemeProvider from "@/components/providers/ThemeProvider";
import PageTransition from "./PageTransition";
import InitialReveal from "./InitialReveal";

export default function TransitionWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <InitialReveal />
      <PageTransition>{children}</PageTransition>
    </ThemeProvider>
  );
}
