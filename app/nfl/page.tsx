import NflPage from "./nfl-page";
import { buildNflSnapshot } from "@/lib/build-snapshot";
export default async function Page() {
  return <NflPage initial={await buildNflSnapshot()} />;
}
