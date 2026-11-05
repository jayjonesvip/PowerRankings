import { mkdir, writeFile, rename } from "node:fs/promises";
import { parseBasketballStandings } from "../lib/nba-model.ts";

const now=new Date();
// ESPN labels NBA seasons by their ending year. Start with the requested 2026–27 season.
const season=process.env.NBA_SEASON ? Number(process.env.NBA_SEASON) : Math.max(2027,now.getUTCFullYear()+(now.getUTCMonth()>=9?1:0));
if (!Number.isInteger(season) || season<2027) throw new Error("Invalid NBA_SEASON");
const url=`https://site.api.espn.com/apis/v2/sports/basketball/nba/standings?season=${season}&seasontype=2`;
let snapshot;
for(let attempt=0;attempt<3;attempt++) {
  try {
    const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error(`NBA standings HTTP ${response.status}`);
    snapshot=parseBasketballStandings(await response.json(),season,new Date().toISOString());
    break;
  } catch(error) {
    if(attempt===2)throw error;
    await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
  }
}
await mkdir("public/data/nba",{recursive:true});
await writeFile("public/data/nba/current.json.tmp",JSON.stringify(snapshot,null,2)+"\n");
await rename("public/data/nba/current.json.tmp","public/data/nba/current.json");
console.log(`NBA ${snapshot.seasonLabel}: ${snapshot.teams.length} teams, ${snapshot.completedGames} completed games`);
