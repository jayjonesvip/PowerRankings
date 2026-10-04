import SportsHub from "./sports-hub";
import { buildNflSnapshot, buildHockeySnapshot } from "@/lib/build-snapshot";
export default async function Page() {
  const [initial, initialHockey] = await Promise.all([buildNflSnapshot(), buildHockeySnapshot()]);
  return <SportsHub initial={initial} initialHockey={initialHockey} />;
}
