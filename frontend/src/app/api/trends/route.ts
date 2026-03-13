import { NextRequest, NextResponse } from "next/server";
import { fetchGoogleTrends, getRegionalGeo, getGeoForCountry, LANGUAGE_STATE_MAP } from "@/lib/regionalSources";

// GET /api/trends?country=in&lang=te
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const country = searchParams.get("country") || "in";
  const lang = searchParams.get("lang") || "en";

  const isRegionalIndian = country === "in" && LANGUAGE_STATE_MAP[lang];
  const geo = isRegionalIndian ? getRegionalGeo(lang, country) : getGeoForCountry(country);

  try {
    const trends = await fetchGoogleTrends(geo);

    return NextResponse.json({
      trends: trends.slice(0, 20),
      geo,
      region: isRegionalIndian ? LANGUAGE_STATE_MAP[lang].states.join(", ") : country.toUpperCase(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch trends", details: String(err), trends: [] },
      { status: 500 }
    );
  }
}
