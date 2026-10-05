import { PageSeo } from "@/components/page-seo";
import { descriptions } from "@/lib/seo";
import BaseballPage from "./baseball-page";
import { buildBaseballSnapshot } from "@/lib/build-snapshot";
export default async function Page() { return <><PageSeo path="mlb/" name="MLB Snapshot" description={descriptions.mlb} /><BaseballPage initialData={await buildBaseballSnapshot()} /></>; }
