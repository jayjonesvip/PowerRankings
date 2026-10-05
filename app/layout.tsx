import type { Metadata } from "next";
import "./globals.css";

const siteUrl = `https://jayjonesvip.github.io${process.env.NEXT_PUBLIC_BASE_PATH || "/PowerRankings"}/`;
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Jay's League Pulse | Standings, Standouts and Stats",
  description: "Standings, standouts, and the numbers behind every league. Current NFL, NHL, and MLB dashboards, MVPs, opponent comparisons, and power rankings, updated hourly.",
  keywords: ["sports power rankings", "NFL power rankings", "NBA power rankings", "NFL team rankings", "best NFL teams", "NFL offense rankings", "NFL defense rankings"],
  alternates: { canonical: siteUrl },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Jay's League Pulse",
    description: "Standings, standouts, and the numbers behind every league.",
    url: siteUrl,
    siteName: "Jay's League Pulse",
    type: "website",
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: `${base}/jays-logo.png`,
    shortcut: `${base}/jays-logo.png`,
    apple: `${base}/jays-logo.png`,
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
