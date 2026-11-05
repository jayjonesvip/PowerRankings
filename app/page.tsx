import { PageSeo } from "@/components/page-seo";
import { descriptions } from "@/lib/seo";
import SportsHub from "./sports-hub";
import { buildNflSnapshot, buildHockeySnapshot, buildBaseballSnapshot, buildBasketballSnapshot } from "@/lib/build-snapshot";
export default async function Page() {
  const [initial, initialHockey, initialBaseball, initialBasketball] = await Promise.all([buildNflSnapshot(), buildHockeySnapshot(), buildBaseballSnapshot(), buildBasketballSnapshot()]);
  return <><PageSeo path="" name="League Snapshot" description={descriptions.home} /><SportsHub initial={initial} initialHockey={initialHockey} initialBaseball={initialBaseball} initialBasketball={initialBasketball} /></>;
}
