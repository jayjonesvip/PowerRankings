import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jay's NFL Power Rankings 2026: All 32 Teams",
  description: "See Jay's NFL power rankings for all 32 teams, updated after every final using record, opponent strength, offense, defense, and scoring margin.",
  alternates: { canonical: "/nfl" },
  openGraph: {
    title: "Jay's NFL Power Rankings 2026: All 32 Teams",
    description: "Data-driven NFL team rankings updated after every completed game.",
    url: "/nfl",
  },
};

export default function NflLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
