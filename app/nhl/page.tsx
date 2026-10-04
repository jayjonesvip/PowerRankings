import HockeyPage from "./hockey-page";
import { buildHockeySnapshot } from "@/lib/build-snapshot";
export default async function Page() {
  return <HockeyPage initialData={await buildHockeySnapshot()} />;
}
