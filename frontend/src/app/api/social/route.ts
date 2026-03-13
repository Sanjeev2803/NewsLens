import { NextRequest, NextResponse } from "next/server";
import { fetchAllSocial } from "@/lib/socialSources";

// GET /api/social?country=in&lang=ta&category=general
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const country = searchParams.get("country") || "in";
  const lang = searchParams.get("lang") || "en";
  const category = searchParams.get("category") || "general";

  try {
    const result = await fetchAllSocial(country, lang, category);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch social data", details: String(err), posts: [], platforms: [] },
      { status: 500 }
    );
  }
}
