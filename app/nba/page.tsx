import { PageSeo } from "@/components/page-seo";
import { descriptions, pageMetadata } from "@/lib/seo";
import { buildBasketballSnapshot } from "@/lib/build-snapshot";
import BasketballPage from "./basketball-page";
export const metadata = pageMetadata("nba/", "NBA Snapshot | Conference Standings & Team Scoring", descriptions.nba);
export default async function Page() { return <><PageSeo path="nba/" name="NBA Snapshot" description={descriptions.nba}/><BasketballPage initialData={await buildBasketballSnapshot()}/></>; }
