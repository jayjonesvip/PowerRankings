import type { MetadataRoute } from "next";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { siteUrl } from "@/lib/site-url";
import { readWeeklyPost } from "@/lib/weekly-posts";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const readSnapshot = async (path: string) => JSON.parse(await readFile(join(process.cwd(), "public/data", path), "utf8"));
  const nfl = await readSnapshot("nfl/current.json");
  const snapshots = await Promise.all([
    readSnapshot(`nfl/${nfl.season}/manifest.json`),
    readSnapshot("nhl/current.json"),
    readSnapshot("mlb/current.json"),
  ]);
  const lastModified = snapshots.map(snapshot => {
    const date = new Date(snapshot.updatedAt);
    if (!Number.isFinite(date.getTime())) throw new Error("Invalid sitemap snapshot date");
    return date;
  });
  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(Math.max(...lastModified.map(date => date.getTime()))), changeFrequency: "hourly" },
    ...(["nfl", "nhl", "mlb"] as const).map((league, index) => ({
      url: `${siteUrl}${league}/`, lastModified: lastModified[index], changeFrequency: "hourly" as const,
    })),
  ];
  const columns = await Promise.all((["nfl", "nhl", "mlb", "nba"] as const).map(async league => {
    const post = await readWeeklyPost(league);
    return {
      url: `${siteUrl}${league}/power-rankings/`,
      ...(post ? { lastModified: new Date(post.publishedAt ?? post.asOf) } : {}),
      changeFrequency: "weekly" as const,
    };
  }));
  return [...entries, ...columns];
}
