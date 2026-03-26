"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Signing you in...");

  useEffect(() => {
    const supabase = createClient();

    // Listen for auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        setStatus("Success! Redirecting...");
        router.replace("/profile");
      }
    });

    // Check if already authenticated
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/profile");
      }
    });

    // Check URL hash for tokens (implicit flow)
    if (window.location.hash.includes("access_token")) {
      // Supabase client handles this automatically
      return;
    }

    // Check URL params for code (PKCE flow)
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setStatus("Authentication failed. Redirecting to login...");
          setTimeout(() => router.replace("/auth/login"), 2000);
        }
      });
      return;
    }

    // Check for error in hash
    if (window.location.hash.includes("error")) {
      setStatus("Authentication failed. Redirecting to login...");
      setTimeout(() => router.replace("/auth/login"), 2000);
      return;
    }

    // Fallback timeout
    const timeout = setTimeout(() => {
      setStatus("Taking too long. Redirecting...");
      router.replace("/auth/login");
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-scroll-cream/20 border-t-scroll-cream rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-mist-gray/50">{status}</p>
      </div>
    </main>
  );
}
