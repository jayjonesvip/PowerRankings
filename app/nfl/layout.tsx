import type { Metadata } from "next";
import { descriptions, pageMetadata } from "@/lib/seo";
export const metadata: Metadata = pageMetadata("nfl/", "NFL Snapshot | Standings, Leaders & Team Stats", descriptions.nfl);
export default function Layout({children}:{children:React.ReactNode}) { return children; }
