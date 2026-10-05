import type { Metadata } from "next";
import { readFileSync } from "node:fs";
const season = JSON.parse(readFileSync("public/data/nfl/current.json", "utf8")).season;

export const metadata: Metadata = {
  title: `League Snapshot: NFL ${season} | Standings and MVPs`,
  description: "Current NFL division standings, offensive and defensive MVPs, and league stats updated hourly. Jay’s power rankings are a separate weekly column.",
  alternates: { canonical: `https://jayjonesvip.github.io${process.env.NEXT_PUBLIC_BASE_PATH || "/PowerRankings"}/nfl/` },
  openGraph: {
    title: `League Snapshot: NFL ${season} | Standings and MVPs`,
    description: "NFL regular-season standings, standouts, and team performance updated hourly.",
    url: `https://jayjonesvip.github.io${process.env.NEXT_PUBLIC_BASE_PATH || "/PowerRankings"}/nfl/`,
  },
};

export default function NflLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
