import type { Metadata } from "next";
import { descriptions, pageMetadata } from "@/lib/seo";
export const metadata: Metadata = pageMetadata("nhl/", "NHL Snapshot | Standings, Leaders & Team Stats", descriptions.nhl);
export default function Layout({children}:{children:React.ReactNode}) { return children; }
