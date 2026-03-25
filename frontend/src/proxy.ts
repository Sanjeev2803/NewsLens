import { NextRequest, NextResponse } from "next/server";

/*
  Global proxy — runs on every matched request.
  - CORS headers on API routes
  - Input sanitization on query params
  Migrated from middleware.ts for Next.js 16 compatibility.
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
  page: /^\d{1,4}$/,
  limit: /^\d{1,3}$/,
  // Whatif-image proxy params
  prompt: /^[a-zA-Z0-9 ,.\-!?':;()_@#%&+=/\[\]]+$/,
  seed: /^\d{1,12}$/,
};

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

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
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      };
      if (corsOrigin) preflightHeaders["Access-Control-Allow-Origin"] = corsOrigin;
      return new NextResponse(null, { status: 204, headers: preflightHeaders });
    }

    const response = NextResponse.next();
    if (corsOrigin) response.headers.set("Access-Control-Allow-Origin", corsOrigin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
