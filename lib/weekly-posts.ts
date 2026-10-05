import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { validateWeeklyPost, type RankingLeague, type WeeklyPost } from "./weekly-rankings";
export async function readWeeklyPost(league:RankingLeague):Promise<WeeklyPost|null> {
  try { return validateWeeklyPost(JSON.parse(await readFile(join(process.cwd(),"content/power-rankings",`${league}.json`),"utf8"))); }
  catch(error) { if((error as NodeJS.ErrnoException).code==="ENOENT" && league==="nba") return null; throw error; }
}
