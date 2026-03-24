import { NextRequest, NextResponse } from "next/server";

/*
  Global middleware — runs on every request.
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
  page: /^\d{1,4}$/,
  limit: /^\d{1,3}$/,
  // Whatif-image proxy params
  prompt: /^[a-zA-Z0-9 ,.\-!?':;()_@#%&+=/\[\]]+$/,
  seed: /^\d{1,12}$/,
  // Article page params — allow URL-safe characters
  url: /^https?:\/\/.+$/,
  title: /^.{0,500}$/,
  source: /^.{0,100}$/,
  image: /^https?:\/\/.+$/,
  description: /^.{0,1000}$/,
};

export function middleware(req: NextRequest) {
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
      // Reject unknown params (except known ones)
      if (!ALLOWED_PARAMS[key] && !key.startsWith("_")) {
        // Allow through — don't block unknown params, just ignore them
      }
    }

    // ── Security + CORS headers ──
    const origin = req.headers.get("origin") || "";
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_SITE_URL,
      "http://localhost:3000",
      "http://localhost:3001",
    ].filter(Boolean);
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || "";

    // Handle preflight
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", corsOrigin);
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
