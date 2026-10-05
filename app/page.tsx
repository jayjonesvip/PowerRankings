import { PageSeo } from "@/components/page-seo";
import { descriptions } from "@/lib/seo";
import SportsHub from "./sports-hub";
import { buildNflSnapshot, buildHockeySnapshot, buildBaseballSnapshot } from "@/lib/build-snapshot";
export default async function Page() {
  const [initial, initialHockey, initialBaseball] = await Promise.all([buildNflSnapshot(), buildHockeySnapshot(), buildBaseballSnapshot()]);
  return <><PageSeo path="" name="League Snapshot" description={descriptions.home} /><SportsHub initial={initial} initialHockey={initialHockey} initialBaseball={initialBaseball} /></>;
}
