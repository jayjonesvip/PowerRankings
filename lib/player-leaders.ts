export type PlayerLeader = { id: string; name: string; team: string; value: number };
export function topPlayers(rows: PlayerLeader[], ascending = false): PlayerLeader[] {
  return [...rows].filter(p => Number.isFinite(p.value) && (ascending ? p.value >= 0 : p.value > 0)).sort((a,b) => (ascending ? a.value-b.value : b.value-a.value) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id)).slice(0,5);
}
export function hockeyLeaders(teams: {name:string;players?:{id:string;name:string;goals:number;assists:number;points:number}[]}[]) {
  const players = new Map<string,{id:string;name:string;teams:Set<string>;goals:number;assists:number;points:number}>();
  for(const team of teams) for(const row of team.players ?? []) {
    const player=players.get(row.id) ?? {id:row.id,name:row.name,teams:new Set<string>(),goals:0,assists:0,points:0};
    player.teams.add(team.name); player.goals+=row.goals; player.assists+=row.assists; player.points+=row.points; players.set(row.id,player);
  }
  return Object.fromEntries((["goals","assists","points"] as const).map(key=>[key,topPlayers([...players.values()].map(p=>({id:p.id,name:p.name,team:[...p.teams].join(" / "),value:p[key]})))])) as Record<"goals"|"assists"|"points",PlayerLeader[]>;
}
