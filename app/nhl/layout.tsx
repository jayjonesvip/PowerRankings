import type { Metadata } from "next";
export const metadata: Metadata = { title: "Jay's NHL Power Rankings and League Dashboard", description: "NHL leaders, standings, schedules, and rankings updated hourly from stored data.", alternates: { canonical: "/nhl/" } };
export default function HockeyLayout({ children }: { children: React.ReactNode }) { return children; }
