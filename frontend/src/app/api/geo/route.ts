import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, getClientIp } from "@/lib/rate-limit";

/*
  GET /api/geo
  Returns the user's detected country code based on IP.

  On Vercel: uses x-vercel-ip-country header (automatic, free, accurate).
  On localhost: defaults to "in" (configurable via ?country= override for testing).
*/

export async function GET(req: NextRequest) {
  const clientIp = getClientIp(req);
  const rateCheck = await checkRateLimitAsync(clientIp);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateCheck.retryAfterMs / 1000)) } }
    );
  }
  const vercelCountry = req.headers.get("x-vercel-ip-country");
  const override = req.nextUrl.searchParams.get("country");

  const country = (override || vercelCountry || "in").toLowerCase();

  return NextResponse.json(
    { country },
    {
      headers: {
        "Cache-Control": "private, max-age=300",
      },
    }
  );
}
