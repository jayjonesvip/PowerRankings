import { PageSeo } from "@/components/page-seo";
import { descriptions } from "@/lib/seo";
import NflPage from "./nfl-page";
import { buildNflSnapshot } from "@/lib/build-snapshot";
export default async function Page() {
  return <><PageSeo path="nfl/" name="NFL Snapshot" description={descriptions.nfl} /><NflPage initial={await buildNflSnapshot()} /></>;
}
