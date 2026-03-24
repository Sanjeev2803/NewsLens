import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import ScenarioDetailClient from "./ScenarioDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // Validate UUID format before querying
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { title: "Not Found | NewsLens" };
  }

  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("scenarios")
      .select("title, description, category, cover_image")
      .eq("id", id)
      .single();

    if (!data) return { title: "Not Found | NewsLens" };

    return {
      title: `${data.title} | What-If | NewsLens`,
      description: data.description || `Explore this ${data.category} scenario on NewsLens What-If Dimension.`,
      openGraph: {
        title: data.title,
        description: data.description || undefined,
        type: "article",
        images: data.cover_image ? [{ url: data.cover_image }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: data.title,
        description: data.description || undefined,
        images: data.cover_image ? [data.cover_image] : undefined,
      },
    };
  } catch {
    return { title: "What-If | NewsLens" };
  }
}

export default function ScenarioDetailPage() {
  return <ScenarioDetailClient />;
}
