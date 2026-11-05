import { validateNbaPlayerStats, type NbaPlayerStats } from "./nba-player-stats.ts";
export type BasketballTeam = {
  id:string; name:string; abbreviation:string; conference:string; conferenceRank:number;
  wins:number; losses:number; gamesPlayed:number; winPercentage:number; gamesBehind:number;
  pointsFor:number; pointsAgainst:number; streak:string; lastTen:string;
};
export type BasketballSnapshot = {
  schemaVersion:1; season:number; seasonLabel:string; seasonType:2; updatedAt:string;
  completedGames:number; rankingsReady:boolean; teams:BasketballTeam[]; playerStats?:NbaPlayerStats;
};
const conferences = ["Eastern Conference", "Western Conference"];
export function validateBasketballSnapshot(data:BasketballSnapshot):BasketballSnapshot {
  const fail = () => { throw new Error("Invalid NBA regular-season snapshot"); };
  if (!data || data.schemaVersion!==1 || data.seasonType!==2 || !Number.isInteger(data.season) || data.season<2027 ||
      data.seasonLabel!==`${data.season-1}-${String(data.season).slice(-2)}` || !Number.isFinite(Date.parse(data.updatedAt)) ||
      !Array.isArray(data.teams) || data.teams.length!==30 || new Set(data.teams.map(t=>t.id)).size!==30) fail();
  for (const team of data.teams) {
    if (!team.id || !team.name || !team.abbreviation || !conferences.includes(team.conference) ||
        ![team.wins,team.losses,team.gamesPlayed,team.pointsFor,team.pointsAgainst,team.conferenceRank].every(Number.isInteger) ||
        team.wins<0 || team.losses<0 || team.gamesPlayed!==team.wins+team.losses || team.gamesPlayed>82 ||
        team.pointsFor<0 || team.pointsAgainst<0 || team.conferenceRank<1 || team.conferenceRank>15 ||
        !Number.isFinite(team.gamesBehind) || team.gamesBehind<0 || !Number.isFinite(team.winPercentage) ||
        Math.abs(team.winPercentage-(team.gamesPlayed ? team.wins/team.gamesPlayed : 0))>0.001 ||
        typeof team.streak!=="string" || typeof team.lastTen!=="string" ||
        (team.gamesPlayed===0 ? team.pointsFor!==0 || team.pointsAgainst!==0 : team.pointsFor===0 || team.pointsAgainst===0)) fail();
  }
  for (const conference of conferences) {
    const teams=data.teams.filter(t=>t.conference===conference);
    if (teams.length!==15 || new Set(teams.map(t=>t.conferenceRank)).size!==15) fail();
  }
  const sum=(key:"wins"|"losses"|"pointsFor"|"pointsAgainst")=>data.teams.reduce((n,t)=>n+t[key],0);
  if (sum("wins")!==sum("losses") || sum("pointsFor")!==sum("pointsAgainst") ||
      data.completedGames!==sum("wins") || data.rankingsReady!==data.teams.every(t=>t.gamesPlayed>=5)) fail();
  if(data.playerStats) validateNbaPlayerStats(data.playerStats,data.teams,data.season,data.completedGames);
  return data;
}

// Standings-only index: no claim of opponent adjustment or possession efficiency.
export function rankBasketballTeams(teams:BasketballTeam[]) {
  return teams.map(t=>({...t, score:100*(0.6*t.winPercentage+0.4*(0.5+0.5*Math.tanh((t.pointsFor-t.pointsAgainst)/Math.max(1,t.gamesPlayed)/10)))}))
    .sort((a,b)=>b.score-a.score || a.name.localeCompare(b.name)).map((t,i)=>({...t,rank:i+1}));
}

export function parseBasketballStandings(payload:any, season:number, updatedAt:string):BasketballSnapshot {
  if (payload?.season?.year!==season || !Array.isArray(payload.children) || payload.children.length!==2) throw new Error("Wrong NBA feed season or conferences");
  const teams:BasketballTeam[]=payload.children.flatMap((group:any)=>{
    const standings=group.standings;
    if (!conferences.includes(group.name) || standings?.season!==season || standings.seasonType!==2 || !Array.isArray(standings.entries)) throw new Error("Wrong NBA standings scope");
    return standings.entries.map((entry:any)=>{
      const stats=new Map<string,any>((entry.stats??[]).map((s:any)=>[s.name,s]));
      const number=(name:string):number=>{const value=stats.get(name)?.value;if(typeof value!=="number" || !Number.isFinite(value))throw new Error(`Missing NBA ${name}`);return value;};
      const text=(name:string)=>stats.get(name)?.displayValue??"—";
      const wins=number("wins"),losses=number("losses");
      return {id:String(entry.team?.id??""),name:entry.team?.displayName,abbreviation:entry.team?.abbreviation,conference:group.name,
        conferenceRank:number("playoffSeed"),wins,losses,gamesPlayed:wins+losses,winPercentage:number("winPercent"),gamesBehind:number("gamesBehind"),
        pointsFor:number("pointsFor"),pointsAgainst:number("pointsAgainst"),streak:text("streak"),lastTen:text("Last Ten Games")};
    });
  });
  return validateBasketballSnapshot({schemaVersion:1,season,seasonLabel:`${season-1}-${String(season).slice(-2)}`,seasonType:2,updatedAt,
    completedGames:teams.reduce((n,t)=>n+t.wins,0),rankingsReady:teams.every(t=>t.gamesPlayed>=5),teams});
}
