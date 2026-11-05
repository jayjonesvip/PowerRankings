import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { parseBasketballStandings, validateBasketballSnapshot } from "../lib/nba-model.ts";
import { parseNbaGame, aggregateNbaPlayers } from "../lib/nba-player-stats.ts";

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
async function request(url) {
  for(let attempt=0;attempt<3;attempt++) {
    try {const response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error(`NBA HTTP ${response.status}`);return await response.json();}
    catch(error){if(attempt===2)throw error;await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));}
  }
}
async function mapLimit(rows,fn) {
  let cursor=0;const result=new Array(rows.length);
  await Promise.all(Array.from({length:Math.min(6,rows.length)},async()=>{while(cursor<rows.length){const i=cursor++;result[i]=await fn(rows[i]);}}));
  return result;
}
const api="https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const schedules=await mapLimit(snapshot.teams,async team=>{
  const data=await request(`${api}/teams/${team.id}/schedule?season=${season}&seasontype=2`);
  if(data.season?.year!==season || data.season?.type!==2 || String(data.team?.id)!==team.id || !Array.isArray(data.events)) throw new Error("Wrong NBA schedule scope");
  return data.events.filter(event=>{
    if(event.season?.year!==season || event.seasonType?.type!==2)throw new Error("Non-regular-season NBA schedule event");
    return event.competitions?.[0]?.status?.type?.completed;
  });
});
const events=new Map();
for(const event of schedules.flat()) {
  const competitors=event.competitions[0].competitors;
  if(!event.id || competitors?.length!==2)throw new Error("Invalid NBA schedule game");
  const signature=JSON.stringify(competitors.map(c=>[String(c.id),Number(c.score?.value)]).sort());
  if(events.has(event.id) && events.get(event.id).signature!==signature)throw new Error("Conflicting NBA schedule results");
  events.set(event.id,{event,signature});
}
if(events.size!==snapshot.completedGames)throw new Error("NBA schedules do not match standings game count");
const directory=`public/data/nba/${season}/games`;
await mkdir(directory,{recursive:true});
const games=await mapLimit([...events.values()],async ({event})=>{
  const path=`${directory}/${event.id}.json`;
  let game;
  try {game=JSON.parse(await readFile(path,"utf8"));}catch(error){if(error.code!=="ENOENT")throw error;}
  if(!game) {
    game=parseNbaGame(await request(`${api}/summary?event=${event.id}`),event.id,season);
    await writeFile(`${path}.tmp`,JSON.stringify(game)+"\n");await rename(`${path}.tmp`,path);
  }
  if(game.id!==event.id || game.season!==season || game.seasonType!==2)throw new Error("Wrong cached NBA game identity");
  for(const competitor of event.competitions[0].competitors) if(!game.teams.some(t=>t.id===String(competitor.id)&&t.score===Number(competitor.score?.value))) throw new Error("NBA box score disagrees with schedule");
  return game;
});
snapshot.playerStats=aggregateNbaPlayers(games,snapshot.teams,season);
validateBasketballSnapshot(snapshot);
await writeFile("public/data/nba/current.json.tmp",JSON.stringify(snapshot,null,2)+"\n");
await rename("public/data/nba/current.json.tmp","public/data/nba/current.json");
console.log(`NBA ${snapshot.seasonLabel}: ${snapshot.teams.length} teams, ${snapshot.completedGames} completed games`);
