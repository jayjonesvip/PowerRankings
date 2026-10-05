import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Jay's League Pulse: MLB | Regular-Season Standings and Leaders",
  description: "MLB regular-season division standings, best and worst hitting and pitching teams, home-run leaders, qualified batting-average leaders, hitter and pitcher MVP picks, and wins and losses.",
  alternates: { canonical: `https://jayjonesvip.github.io${process.env.NEXT_PUBLIC_BASE_PATH || "/PowerRankings"}/mlb/` },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
