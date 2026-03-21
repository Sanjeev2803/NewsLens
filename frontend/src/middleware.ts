import { NextRequest, NextResponse } from "next/server";

/*
  Global middleware — runs on every request.
  - CORS headers on API routes
  - Input sanitization on query params
*/

const ALLOWED_PARAMS: Record<string, RegExp> = {
  category: /^[a-z]{2,20}$/,
  country: /^[a-z]{2}$/,
  lang: /^[a-z]{2,5}$/,
  max: /^\d{1,3}$/,
  countries: /^[a-z,]{2,50}$/,
  _cache: /^[a-z]+$/,
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

    // ── CORS headers ──
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
