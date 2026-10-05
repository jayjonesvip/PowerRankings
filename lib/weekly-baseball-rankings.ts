import type { BaseballTeam } from "./mlb-model";
export function rankBaseballTeams(teams:BaseballTeam[]) {
  if (!teams.length) return [];
  const curve=(v:number,scale:number)=>50+50*Math.tanh(v/scale);
  const batting=teams.reduce((s,t)=>s+t.battingAverage,0)/teams.length;
  const era=teams.reduce((s,t)=>s+t.era,0)/teams.length;
  return teams.map(t=>({...t,score:40*t.wins/Math.max(1,t.gamesPlayed)+.30*curve((t.runsFor-t.runsAgainst)/Math.max(1,t.gamesPlayed),1.5)+.15*curve(t.battingAverage-batting,.02)+.15*curve(era-t.era,1)})).sort((a,b)=>b.score-a.score||a.abbreviation.localeCompare(b.abbreviation)).map((t,i)=>({...t,rank:i+1}));
}
