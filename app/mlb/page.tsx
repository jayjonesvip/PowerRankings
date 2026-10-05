import BaseballPage from "./baseball-page";
import { buildBaseballSnapshot } from "@/lib/build-snapshot";
export default async function Page() { return <BaseballPage initialData={await buildBaseballSnapshot()} />; }
