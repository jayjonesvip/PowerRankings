import { readFile, mkdir, writeFile, rename } from "node:fs/promises";
import { validateBaseballSnapshot } from "../lib/mlb-model.ts";
import { baseballMvps } from "./league-mvp-model.mjs";
const endpoint = "https://statsapi.mlb.com/api/v1/";
async function request(path, params = {}) {
  const url = new URL(path, endpoint); for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`MLB HTTP ${response.status}`);
      return await response.json();
    } catch (error) { if (attempt === 2) throw error; await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); }
  }
}
const now = new Date(); let season = now.getUTCFullYear();
let info = (await request(`seasons/${season}`, { sportId: 1 })).seasons?.[0];
if (!info?.regularSeasonStartDate) throw new Error("Missing MLB season dates");
if (now.toISOString().slice(0, 10) < info.regularSeasonStartDate) {
  season--; info = (await request(`seasons/${season}`, { sportId: 1 })).seasons?.[0];
}
if (String(info?.seasonId) !== String(season) || !info.regularSeasonEndDate) throw new Error("Wrong MLB season");
const [standings, hitting, pitching, hr, avg, decisions, playerHitting, playerPitching] = await Promise.all([
  request("standings", { leagueId: "103,104", season, standingsTypes: "regularSeason", hydrate: "team(division,league)" }),
  request("teams/stats", { season, sportIds: 1, stats: "season", group: "hitting", gameType: "R" }),
  request("teams/stats", { season, sportIds: 1, stats: "season", group: "pitching", gameType: "R" }),
  request("stats/leaders", { season, sportId: 1, leaderCategories: "homeRuns", statGroup: "hitting", leaderGameTypes: "R", limit: 100 }),
  request("stats/leaders", { season, sportId: 1, leaderCategories: "battingAverage", statGroup: "hitting", leaderGameTypes: "R", playerPool: "QUALIFIED", limit: 100 }),
  request("stats/leaders", { season, sportId: 1, leaderCategories: "wins,losses", statGroup: "pitching", leaderGameTypes: "R", limit: 100 }),
  request("stats", { season, sportIds: 1, stats: "season", group: "hitting", gameType: "R", playerPool: "ALL", limit: 2000 }),
  request("stats", { season, sportIds: 1, stats: "season", group: "pitching", gameType: "R", playerPool: "ALL", limit: 2000 }),
]);
function statsMap(payload, group) {
  const section = payload.stats?.find(s => s.group?.displayName === group && s.type?.displayName === "season");
  if (section?.splits?.length !== 30 || section.splits.some(s => String(s.season) !== String(season)) || new Set(section.splits.map(s => s.team?.id)).size !== 30) throw new Error(`Incomplete MLB ${group}`);
  return new Map(section.splits.map(s => [s.team.id, s.stat]));
}
const batting = statsMap(hitting, "hitting"), throwing = statsMap(pitching, "pitching");
if (standings.records?.length !== 6 || standings.records.some(r => r.standingsType !== "regularSeason")) throw new Error("Invalid regular-season divisions");
const teams = standings.records.flatMap(record => record.teamRecords.map(row => {
  if (String(row.season) !== String(season)) throw new Error("Wrong standings season");
  const hit = batting.get(row.team.id), pitch = throwing.get(row.team.id);
  if (!hit || !pitch || hit.gamesPlayed !== row.gamesPlayed || pitch.gamesPlayed !== row.gamesPlayed) throw new Error(`MLB stats/standings disagree: ${row.team.name}`);
  return { id: String(row.team.id), name: row.team.name, abbreviation: row.team.abbreviation, league: row.team.league.name,
    division: row.team.division.name.split(" ").at(-1), divisionRank: Number(row.divisionRank), gamesPlayed: row.gamesPlayed,
    wins: row.wins, losses: row.losses, runsFor: row.runsScored, runsAgainst: row.runsAllowed,
    hits: hit.hits, atBats: hit.atBats, battingAverage: Number(hit.avg), homeRuns: hit.homeRuns, era: Number(pitch.era) };
}));
function leaders(payload, category) {
  const section = payload.leagueLeaders?.find(s => s.leaderCategory === category);
  if (!section || section.gameType?.id !== "R" || String(section.season) !== String(season) || !section.leaders?.length) throw new Error(`Invalid regular-season ${category} leaders`);
  const max = Math.max(...section.leaders.map(p => Number(p.value)));
  return section.leaders.filter(p => Number(p.value) === max).map(p => ({ id: String(p.person.id), name: p.person.fullName,
    team: p.numTeams > 1 ? "Multiple teams" : p.team?.name, value: Number(p.value) }));
}
const snapshot = validateBaseballSnapshot({ schemaVersion: 1, season, gameType: "R", updatedAt: now.toISOString(), regularSeasonEnd: info.regularSeasonEndDate,
  seasonComplete: now.toISOString().slice(0, 10) > info.regularSeasonEndDate,
  completedGames: teams.reduce((sum, t) => sum + t.gamesPlayed, 0) / 2, totalHomeRuns: teams.reduce((sum, t) => sum + t.homeRuns, 0), teams,
  leaders: { homeRuns: leaders(hr, "homeRuns"), battingAverage: leaders(avg, "battingAverage"), wins: leaders(decisions, "wins"), losses: leaders(decisions, "losses") } });
function playerRows(payload, group) {
  const section = payload.stats?.find(s=>s.group?.displayName===group&&s.type?.displayName==="season");
  if (!section || section.splits.length!==section.totalSplits || new Set(section.splits.map(s=>s.player.id)).size!==section.splits.length || section.splits.some(s=>String(s.season)!==String(season))) throw new Error(`Invalid MLB player ${group}`);
  const averageGames=teams.reduce((n,t)=>n+t.gamesPlayed,0)/teams.length;
  return section.splits.map(row=>{
    const stat=row.stat,team=teams.find(t=>t.id===String(row.team?.id));
    const common={id:String(row.player.id),name:row.player.fullName,team:row.numTeams>1 ? "Multiple teams" : team?.name,teamGames:row.numTeams>1 ? averageGames : team?.gamesPlayed,gamesPlayed:stat.gamesPlayed};
    if (!common.name||!common.team||!Number.isFinite(common.teamGames)) throw new Error("Missing MLB player club");
    const counts=group==="hitting" ? ["plateAppearances","homeRuns","rbi"] : ["outs","strikeOuts"];
    if (counts.some(k=>!Number.isInteger(stat[k])||stat[k]<0)) throw new Error("Invalid MLB player counters");
    if (group==="hitting") {
      const ops=Number(stat.ops);
      if(stat.plateAppearances&& !Number.isFinite(ops)) throw new Error("Invalid player OPS");
      return {...common,plateAppearances:stat.plateAppearances,homeRuns:stat.homeRuns,rbi:stat.rbi,ops};
    }
    const era=Number(stat.era),whip=Number(stat.whip);
    if(stat.outs&&(!Number.isFinite(era)||!Number.isFinite(whip))) throw new Error("Invalid player ERA/WHIP");
    return {...common,outs:stat.outs,strikeOuts:stat.strikeOuts,era,whip};
  });
}
snapshot.mvps=baseballMvps(playerRows(playerHitting,"hitting"),playerRows(playerPitching,"pitching"));
let previous; try { previous = JSON.parse(await readFile("public/data/mlb/current.json", "utf8")); } catch {}
if (previous?.season === season && snapshot.completedGames < previous.completedGames) throw new Error("Refusing truncated MLB season");
await mkdir("public/data/mlb", { recursive: true });
await writeFile("public/data/mlb/current.json.tmp", JSON.stringify(snapshot));
await rename("public/data/mlb/current.json.tmp", "public/data/mlb/current.json");
console.log(`Stored MLB ${season}: ${snapshot.completedGames} regular-season games; ${snapshot.totalHomeRuns} HR`);
