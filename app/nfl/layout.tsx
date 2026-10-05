import type { Metadata } from "next";
import { readFileSync } from "node:fs";
const season = JSON.parse(readFileSync("public/data/nfl/current.json", "utf8")).season;

export const metadata: Metadata = {
  title: `League Snapshot: NFL ${season} | Standings and MVPs`,
  description: "Current NFL division standings, offensive and defensive MVPs, league stats, and power rankings for all 32 teams. Updated hourly from completed games.",
  alternates: { canonical: `https://jayjonesvip.github.io${process.env.NEXT_PUBLIC_BASE_PATH || "/PowerRankings"}/nfl/` },
  openGraph: {
    title: `League Snapshot: NFL ${season} | Standings and MVPs`,
    description: "Data-driven NFL team rankings updated after every completed game.",
    url: `https://jayjonesvip.github.io${process.env.NEXT_PUBLIC_BASE_PATH || "/PowerRankings"}/nfl/`,
  },
};

export default function NflLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
