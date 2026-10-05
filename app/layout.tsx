import type { Metadata } from "next";
import "./globals.css";

import { siteUrl } from "@/lib/site-url";
import { descriptions, pageMetadata } from "@/lib/seo";
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  ...pageMetadata("", "League Snapshot | NFL, NHL and MLB Standings & Stats", descriptions.home),
  robots: { index: true, follow: true },
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
      <body className="antialiased"><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":`${siteUrl}#organization`,name:"League Snapshot",url:siteUrl,logo:{"@type":"ImageObject",url:`${siteUrl}league-snapshot-logo.png`}}, {"@type":"WebSite","@id":`${siteUrl}#website`,name:"League Snapshot",url:siteUrl,inLanguage:"en-US",publisher:{"@id":`${siteUrl}#organization`}}]}).replace(/</g,"\\u003c")}} />{children}</body>
    </html>
  );
}
