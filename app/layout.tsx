import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nfl-power-rankings.jayjonesvip.chatgpt.site"),
  title: "Jay's Power Rankings | NFL, NHL and NBA Rankings",
  description: "Jay's data-driven sports power rankings, league leaders, biggest movers, offense and defense trends.",
  keywords: ["sports power rankings", "NFL power rankings", "NBA power rankings", "NFL team rankings", "best NFL teams", "NFL offense rankings", "NFL defense rankings"],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Jay's Power Rankings",
    description: "Data-driven sports rankings, current leaders and biggest movers.",
    url: "/",
    siteName: "Jay's Power Rankings",
    type: "website",
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/jays-logo.png",
    shortcut: "/jays-logo.png",
    apple: "/jays-logo.png",
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
