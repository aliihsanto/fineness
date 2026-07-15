import type { MetadataRoute } from "next";
import { getLeaderboard } from "../lib/data";

// served fresh so newly assayed tokens appear without a rebuild
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fineness.xyz";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getLeaderboard();
  return [
    { url: `${SITE}/`, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE}/methodology`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/docs`, changeFrequency: "monthly", priority: 0.7 },
    ...entries.map((e) => ({
      url: `${SITE}/t/${encodeURIComponent(e.symbol)}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
