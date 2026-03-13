"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/lib/api";
import { SWR_CONFIG } from "@/lib/constants";
import type { ReactNode } from "react";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        ...SWR_CONFIG,
      }}
    >
      {children}
    </SWRConfig>
  );
}
