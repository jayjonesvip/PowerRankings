import type { Metadata } from "next";
import "./globals.css";

const siteUrl = `https://jayjonesvip.github.io${process.env.NEXT_PUBLIC_BASE_PATH || "/PowerRankings"}/`;
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "League Snapshot | Standings, Standouts and Stats",
  description: "Standings, standouts, and the numbers behind every league. NFL, NHL, and MLB snapshots, MVPs, and opponent comparisons updated hourly, plus Jay’s weekly power rankings columns.",
  keywords: ["sports power rankings", "NFL power rankings", "NBA power rankings", "NFL team rankings", "best NFL teams", "NFL offense rankings", "NFL defense rankings"],
  alternates: { canonical: siteUrl },
  robots: { index: true, follow: true },
  openGraph: {
    title: "League Snapshot",
    description: "Standings, standouts, and the numbers behind every league.",
    url: siteUrl,
    siteName: "League Snapshot",
    type: "website",
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: `${base}/league-snapshot-logo.png`,
    shortcut: `${base}/league-snapshot-logo.png`,
    apple: `${base}/league-snapshot-logo.png`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
