import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { currentNflSeason } from "./local-data";
import { buildSnapshots, fetchSeasonGames } from "./rankings";
import { fetchDashboardData } from "./dashboard-data";
import type { HockeySnapshot } from "./nhl-model";
import type { MvpSnapshot } from "@/components/nfl-league-mvps";

// Build-time reads use exactly the JSON files included in the Pages artifact.
const readNfl = async (path: string) => JSON.parse(await readFile(join(process.cwd(), "public/data/nfl", path), "utf8"));
export async function buildNflSnapshot() {
  const season = currentNflSeason();
  const games = await fetchSeasonGames(season, readNfl);
  const snapshots = buildSnapshots(games);
  const week = snapshots.at(-1)?.week ?? 1;
  const [manifest, dashboard, mvp] = await Promise.all([
    readNfl(`${season}/manifest.json`),
    fetchDashboardData(season, week, undefined, readNfl),
    readNfl("mvp-current.json") as Promise<MvpSnapshot>,
  ]);
  return { season, games, snapshots, updatedAt: manifest.updatedAt as string, dashboard, mvp };
}
export async function buildHockeySnapshot(): Promise<HockeySnapshot> {
  return JSON.parse(await readFile(join(process.cwd(), "public/data/nhl/current.json"), "utf8"));
}
