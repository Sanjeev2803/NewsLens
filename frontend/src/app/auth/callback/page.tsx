"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/*
  OAuth callback — handles both implicit flow (hash fragment) and PKCE (code param).
  Supabase's browser client auto-detects the token in the URL hash and sets the session.
*/

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    // The Supabase client automatically picks up the hash fragment
    // and exchanges it for a session via onAuthStateChange
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.replace("/profile");
      }
    });

    // Fallback: if already signed in (e.g., page refresh), redirect
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/profile");
      } else {
        // If no session after 5 seconds, something went wrong
        setTimeout(() => {
          router.replace("/auth/login");
        }, 5000);
      }
    });
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-scroll-cream/20 border-t-scroll-cream rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-mist-gray/50">Signing you in...</p>
      </div>
    </main>
  );
}
