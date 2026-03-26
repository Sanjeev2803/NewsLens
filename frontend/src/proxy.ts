import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/*
  Global proxy — runs on every matched request.
  - Supabase auth session refresh (keeps tokens alive)
  - CORS headers on API routes
  - Input sanitization on query params
*/

const ALLOWED_PARAMS: Record<string, RegExp> = {
  category: /^[a-z_]{2,20}$/,
  country: /^[a-z]{2}$/,
  lang: /^[a-z]{2,5}$/,
  max: /^\d{1,3}$/,
  countries: /^[a-z,]{2,50}$/,
  _cache: /^[a-z]+$/,
  // What-If params
  sort: /^[a-z_]{2,20}$/,
  source: /^[a-z]{2,10}$/,
  page: /^\d{1,4}$/,
  limit: /^\d{1,3}$/,
  // Whatif-image proxy params
  prompt: /^[a-zA-Z0-9 ,.\-!?':;()_@#%&+=/\[\]]+$/,
  seed: /^\d{1,12}$/,
};

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  let response = NextResponse.next({ request: req });

  // ── Supabase auth session refresh ──
  // Silently refresh expired tokens on every request
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              req.cookies.set(name, value)
            );
            response = NextResponse.next({ request: req });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      });
      // Fire and forget — refreshes session if needed
      supabase.auth.getUser();
    } catch {
      // Auth refresh is best-effort — don't block requests
    }
  }

  // Only apply sanitization + CORS to API routes
  if (pathname.startsWith("/api/")) {
    // ── Sanitize query params ──
    for (const [key, value] of req.nextUrl.searchParams) {
      const pattern = ALLOWED_PARAMS[key];
      if (pattern && !pattern.test(value)) {
        return NextResponse.json(
          { error: `Invalid parameter: ${key}` },
          { status: 400 }
        );
      }
    }

    // ── Security + CORS headers ──
    const origin = req.headers.get("origin") || "";
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL,
      "http://localhost:3000",
      "http://localhost:3001",
    ].filter(Boolean);
    const corsOrigin = allowedOrigins.includes(origin) ? origin : "";

    // Handle preflight
    if (req.method === "OPTIONS") {
      const preflightHeaders: Record<string, string> = {
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      };
      if (corsOrigin) preflightHeaders["Access-Control-Allow-Origin"] = corsOrigin;
      return new NextResponse(null, { status: 204, headers: preflightHeaders });
    }

    if (corsOrigin) response.headers.set("Access-Control-Allow-Origin", corsOrigin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
