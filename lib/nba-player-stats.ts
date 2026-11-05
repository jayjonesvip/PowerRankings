import type { BasketballTeam } from "./nba-model";
import type { PlayerLeader } from "./player-leaders";
import { basketballScoringBreakdown, parseNbaScoring, type NbaScoring } from "./nba-scoring.ts";
export const nbaCategories = ["points", "assists", "rebounds", "steals", "blocks"] as const;
export type NbaCategory = typeof nbaCategories[number];
export type NbaTotals = Record<NbaCategory, number>;
export type NbaStint = NbaTotals & { teamId:string; gamesPlayed:number; pointsInWins:number };
export type NbaPlayer = { id:string; name:string; stints:NbaStint[] };
export type NbaGame = { id:string; season:number; seasonType:2; teams:{id:string;score:number;scoring:NbaScoring;players:(NbaTotals & {id:string;name:string})[]}[] };
export type NbaPlayerStats = { season:number; seasonType:2; completedGames:number; players:NbaPlayer[]; scoring?:NbaScoring };
const zero = ():NbaTotals => ({points:0,assists:0,rebounds:0,steals:0,blocks:0});
export const nbaMvpMethod = "All-around production: points 40%, assists 20%, rebounds 20%, steals 10%, blocks 10%. Each category uses production per team game, scaled against the best eligible player's rate. Multiply by 25% + 75% of the team's power-index score (record 60%, scoring margin 40%). Missing games reduce production per team game. Players need at least five appearances and 70% of their team's games. Traded players combine their season totals; team strength is weighted by appearances across clubs. This is a statistical MVP estimate, not an official award or a measure of wins caused by an individual.";

export function parseNbaGame(payload:any, id:string, season:number):NbaGame {
  const header=payload?.header, competition=header?.competitions?.[0];
  if(header?.id!==id || header.season?.year!==season || header.season?.type!==2 || !competition?.status?.type?.completed ||
    competition.competitors?.length!==2 || payload.boxscore?.players?.length!==2) throw new Error("Invalid NBA completed regular-season box score");
  const teams=competition.competitors.map((competitor:any)=>{
    const teamId=String(competitor.id), score=Number(competitor.score);
    const section=payload.boxscore.players.find((t:any)=>String(t.team.id)===teamId);
    if(!section || !Number.isInteger(score) || score<1 || section.statistics?.length!==1) throw new Error("Missing NBA team box score");
    const stats=section.statistics[0], labels=stats.names??stats.labels;
    const columns={points:"PTS",assists:"AST",rebounds:"REB",steals:"STL",blocks:"BLK"};
    if(!Array.isArray(labels) || Object.values(columns).some(label=>!labels.includes(label)) || !Array.isArray(stats.athletes)) throw new Error("Missing NBA statistic columns");
    const players=stats.athletes.filter((p:any)=>!p.didNotPlay).map((p:any)=>{
      const row:any={id:String(p.athlete?.id??""),name:p.athlete?.displayName};
      for(const [key,label] of Object.entries(columns)) {
        const value=p.stats?.[labels.indexOf(label)];
        if(typeof value!=="string" || !/^\d+$/.test(value)) throw new Error(`Missing NBA player ${key}`);
        row[key]=Number(value);
      }
      if(!row.id || !row.name) throw new Error("Missing NBA player identity");
      return row;
    });
    if(!players.length || new Set(players.map((p:any)=>p.id)).size!==players.length || players.reduce((n:number,p:any)=>n+p.points,0)!==score) throw new Error("Incomplete NBA player scoring totals");
    return {id:teamId,score,players,scoring:parseNbaScoring(labels,stats.totals,score)};
  });
  if(teams[0].id===teams[1].id || teams[0].score===teams[1].score) throw new Error("Invalid NBA game result");
  return {id,season,seasonType:2,teams};
}

export function aggregateNbaPlayers(games:NbaGame[], teams:BasketballTeam[], season:number):NbaPlayerStats {
  const totals=new Map(teams.map(t=>[t.id,{games:0,wins:0,points:0,against:0}]));
  const players=new Map<string,NbaPlayer>(), ids=new Set<string>();
  const scoring:NbaScoring={freeThrowsMade:0,threePointersMade:0,twoPointersMade:0};
  for(const game of games) {
    if(!game.id || ids.has(game.id) || game.season!==season || game.seasonType!==2 || game.teams.length!==2) throw new Error("Duplicate or wrong-season NBA game");
    ids.add(game.id);
    for(const [i,team] of game.teams.entries()) {
      const total=totals.get(team.id),opponent=game.teams[1-i];
      if(!total || team.id===opponent.id || team.score===opponent.score || !Number.isInteger(team.score) || team.score<1 || team.players.reduce((n,p)=>n+p.points,0)!==team.score || new Set(team.players.map(p=>p.id)).size!==team.players.length) throw new Error("Invalid cached NBA game");
      basketballScoringBreakdown(team.scoring,team.score);
      for(const key of ["freeThrowsMade","threePointersMade","twoPointersMade"] as const) scoring[key]+=team.scoring[key];
      const win=team.score>opponent.score;
      total.games++;total.wins+=Number(win);total.points+=team.score;total.against+=opponent.score;
      for(const row of team.players) {
        if(!row.id || !row.name || nbaCategories.some(key=>!Number.isInteger(row[key])||row[key]<0)) throw new Error("Invalid NBA player totals");
        const player=players.get(row.id)??{id:row.id,name:row.name,stints:[]};
        let stint=player.stints.find(s=>s.teamId===team.id);
        if(!stint) {stint={teamId:team.id,gamesPlayed:0,pointsInWins:0,...zero()};player.stints.push(stint);}
        stint.gamesPlayed++;stint.pointsInWins+=win?row.points:0;
        for(const key of nbaCategories) stint[key]+=row[key];
        players.set(row.id,player);
      }
    }
  }
  for(const team of teams) {
    const total=totals.get(team.id)!;
    if(total.games!==team.gamesPlayed || total.wins!==team.wins || total.points!==team.pointsFor || total.against!==team.pointsAgainst) throw new Error(`NBA box scores disagree with standings: ${team.name}`);
  }
  const result:NbaPlayerStats={season,seasonType:2,completedGames:games.length,players:[...players.values()].sort((a,b)=>a.id.localeCompare(b.id)),scoring};
  validateNbaPlayerStats(result,teams,season,games.length);
  return result;
}

export function validateNbaPlayerStats(data:NbaPlayerStats,teams:BasketballTeam[],season:number,completedGames:number) {
  if(!data || data.season!==season || data.seasonType!==2 || data.completedGames!==completedGames || !Array.isArray(data.players) || new Set(data.players.map(p=>p.id)).size!==data.players.length) throw new Error("Invalid NBA player snapshot scope");
  const points=new Map(teams.map(t=>[t.id,0]));
  for(const player of data.players) {
    if(!player.id || !player.name || !Array.isArray(player.stints) || !player.stints.length || new Set(player.stints.map(s=>s.teamId)).size!==player.stints.length) throw new Error("Invalid NBA player identity/stints");
    for(const stint of player.stints) {
      const team=teams.find(t=>t.id===stint.teamId);
      if(!team || !Number.isInteger(stint.gamesPlayed) || stint.gamesPlayed<1 || stint.gamesPlayed>team.gamesPlayed ||
          [...nbaCategories,"pointsInWins" as const].some(key=>!Number.isInteger(stint[key])||stint[key]<0) || stint.pointsInWins>stint.points) throw new Error("Invalid NBA player counting stats");
      points.set(team.id,points.get(team.id)!+stint.points);
    }
  }
  if(teams.some(t=>points.get(t.id)!==t.pointsFor)) throw new Error("NBA player scoring does not match team scoring");
  if(data.scoring) basketballScoringBreakdown(data.scoring,teams.reduce((n,t)=>n+t.pointsFor,0));
  return data;
}

export function nbaPlayerRows(data:NbaPlayerStats,teams:BasketballTeam[]) {
  return data.players.map(player=>{
    const totals=zero();let gamesPlayed=0,pointsInWins=0;
    for(const stint of player.stints) {gamesPlayed+=stint.gamesPlayed;pointsInWins+=stint.pointsInWins;for(const key of nbaCategories) totals[key]+=stint[key];}
    const clubs=player.stints.map(s=>teams.find(t=>t.id===s.teamId)!);
    const teamGames=Math.max(gamesPlayed,...clubs.map(t=>t.gamesPlayed));
    return {...player,...totals,gamesPlayed,pointsInWins,teamGames,team:clubs.map(t=>t.name).join(" / "),qualified:gamesPlayed>=Math.max(2,Math.ceil(teamGames*0.7))};
  });
}

export function nbaPlayerLeaders(data:NbaPlayerStats,teams:BasketballTeam[]):Record<NbaCategory,PlayerLeader[]> {
  const players=nbaPlayerRows(data,teams).filter(p=>p.qualified);
  return Object.fromEntries(nbaCategories.map(key=>[key,players.map(p=>({id:p.id,name:p.name,team:p.team,value:p[key]/p.gamesPlayed})).filter(p=>p.value>0).sort((a,b)=>b.value-a.value||a.name.localeCompare(b.name)||a.id.localeCompare(b.id)).slice(0,5)])) as Record<NbaCategory,PlayerLeader[]>;
}

export function nbaMvpCandidates(data:NbaPlayerStats,teams:(BasketballTeam & {score:number;rank:number})[]) {
  const players=nbaPlayerRows(data,teams).filter(p=>p.qualified&&p.gamesPlayed>=5);
  const weights:NbaTotals={points:0.4,assists:0.2,rebounds:0.2,steals:0.1,blocks:0.1};
  const best=Object.fromEntries(nbaCategories.map(key=>[key,Math.max(0,...players.map(p=>p[key]/p.teamGames))])) as NbaTotals;
  return players.map(p=>{
    const production=100*nbaCategories.reduce((n,key)=>n+(best[key]?weights[key]*(p[key]/p.teamGames)/best[key]:0),0);
    const teamStrength=p.stints.reduce((n,s)=>n+teams.find(t=>t.id===s.teamId)!.score*s.gamesPlayed,0)/p.gamesPlayed;
    const multiplier=0.25+0.75*teamStrength/100;
    const contexts=p.stints.map(s=>{const t=teams.find(t=>t.id===s.teamId)!;return `${t.name}: ${t.wins}–${t.losses}, power rank #${t.rank}`;}).join("; ");
    return {...p,production,teamStrength,multiplier,score:production*multiplier,contexts};
  }).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
}
