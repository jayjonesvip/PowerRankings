import type { Metadata } from "next";
import { currentNflSeason } from "@/lib/local-data";
const season = currentNflSeason();

export const metadata: Metadata = {
  title: `Jay's NFL Power Rankings ${season}: Standings and MVPs`,
  description: "Current NFL division standings, offensive and defensive MVPs, league stats, and power rankings for all 32 teams. Updated hourly from completed games.",
  alternates: { canonical: "/nfl/" },
  openGraph: {
    title: `Jay's NFL Power Rankings ${season}: Standings and MVPs`,
    description: "Data-driven NFL team rankings updated after every completed game.",
    url: "/nfl/",
  },
};

export default function NflLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
