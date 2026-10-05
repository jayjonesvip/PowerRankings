import type { Metadata } from "next";
export const metadata: Metadata = { title: "League Snapshot: NHL | Standings and Team Performance", description: "NHL regular-season standings, team scoring, goaltending, skater and goalie MVP picks, updated hourly from stored JSON, with a separate weekly power rankings column.", alternates: { canonical: `https://jayjonesvip.github.io${process.env.NEXT_PUBLIC_BASE_PATH || "/PowerRankings"}/nhl/` } };
export default function HockeyLayout({ children }: { children: React.ReactNode }) { return children; }
