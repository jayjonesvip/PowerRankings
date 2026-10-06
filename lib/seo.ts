import type { Metadata } from "next";
import { siteUrl } from "./site-url";
export const descriptions = {
  home: "NFL, NHL and MLB regular-season standings, player leaders, MVP picks and team stats updated hourly, plus Jay’s weekly power rankings.",
  nfl: "NFL division standings, playoff picture, player leaders, offensive and defensive MVP picks, and team performance. Regular-season snapshots updated hourly.",
  nhl: "NHL division standings, playoff picture, goals, assists and points leaders, team scoring, goalie leaders and MVP picks. Regular-season snapshots updated hourly.",
  mlb: "MLB regular-season standings, playoff seeding, team hitting and pitching, home-run and batting-average leaders, and hitter and pitcher MVP picks.",
};
export function pageMetadata(path: string, title: string, description: string, portrait = false): Metadata {
  const image = `${siteUrl}${portrait ? "jays-logo.png" : "league-snapshot-logo.png"}`;
  const alt = portrait ? "Jay’s weekly power rankings" : "League Snapshot sports statistics";
  return {
    title, description, alternates: { canonical: `${siteUrl}${path}` },
    openGraph: { title, description, url: `${siteUrl}${path}`, siteName: "League Snapshot", type: "website", locale: "en_US", images: [{url:image,alt}] },
    twitter: { card: "summary", title, description, images: [{url:image,alt}] },
  };
}
