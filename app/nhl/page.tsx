import { PageSeo } from "@/components/page-seo";
import { descriptions } from "@/lib/seo";
import HockeyPage from "./hockey-page";
import { buildHockeySnapshot } from "@/lib/build-snapshot";
export default async function Page() {
  return <><PageSeo path="nhl/" name="NHL Snapshot" description={descriptions.nhl} /><HockeyPage initialData={await buildHockeySnapshot()} /></>;
}
