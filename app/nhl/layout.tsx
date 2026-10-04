import type { Metadata } from "next";
export const metadata: Metadata = { title: "Jay's League Pulse: NHL | Standings and Team Performance", description: "NHL leaders, standings, schedules, and rankings updated hourly from stored data.", alternates: { canonical: `https://jayjonesvip.github.io${process.env.NEXT_PUBLIC_BASE_PATH || "/PowerRankings"}/nhl/` } };
export default function HockeyLayout({ children }: { children: React.ReactNode }) { return children; }
