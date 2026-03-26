"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

/*
  Theme Provider — locked to dark mode (Itachi theme).
  Kept as a provider for API compatibility with components that call useTheme().
*/

interface ThemeContextValue {
  theme: "dark";
  toggleTheme: () => void;
  isItachi: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
  isItachi: true,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove("light");
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "dark", toggleTheme: () => {}, isItachi: true }}>
      {children}
    </ThemeContext.Provider>
  );
}
