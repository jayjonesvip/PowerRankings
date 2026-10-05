import type { Metadata } from "next";
import { descriptions, pageMetadata } from "@/lib/seo";
export const metadata: Metadata = pageMetadata("mlb/", "MLB Snapshot | Standings, Leaders & Hitting & Pitching", descriptions.mlb);
export default function Layout({children}:{children:React.ReactNode}) { return children; }
