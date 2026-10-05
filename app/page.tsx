import SportsHub from "./sports-hub";
import { buildNflSnapshot, buildHockeySnapshot, buildBaseballSnapshot } from "@/lib/build-snapshot";
export default async function Page() {
  const [initial, initialHockey, initialBaseball] = await Promise.all([buildNflSnapshot(), buildHockeySnapshot(), buildBaseballSnapshot()]);
  return <SportsHub initial={initial} initialHockey={initialHockey} initialBaseball={initialBaseball} />;
}
