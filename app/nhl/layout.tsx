import type { Metadata } from "next";
export const metadata: Metadata = { title: "Jay's League Pulse: NHL | Standings and Team Performance", description: "NHL regular-season standings, team scoring, goaltending, skater and goalie MVP picks, and rankings updated hourly from stored JSON.", alternates: { canonical: `https://jayjonesvip.github.io${process.env.NEXT_PUBLIC_BASE_PATH || "/PowerRankings"}/nhl/` } };
export default function HockeyLayout({ children }: { children: React.ReactNode }) { return children; }
