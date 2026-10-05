import type { LeagueMvps } from "./league-mvp";
export type BaseballTeam = {
  id: string; name: string; abbreviation: string; league: string; division: string; divisionRank: number;
  gamesPlayed: number; wins: number; losses: number; runsFor: number; runsAgainst: number;
  hits: number; atBats: number; battingAverage: number; homeRuns: number; era: number;
};
export type BaseballLeader = { id: string; name: string; team: string; value: number };
export type BaseballSnapshot = {
  mvps?: LeagueMvps;
  schemaVersion: 1; season: number; gameType: "R"; updatedAt: string; regularSeasonEnd: string;
  seasonComplete: boolean; completedGames: number; totalHomeRuns: number; teams: BaseballTeam[];
  leaders: { homeRuns: BaseballLeader[]; battingAverage: BaseballLeader[]; wins: BaseballLeader[]; losses: BaseballLeader[] };
};
export function validateBaseballSnapshot(data: BaseballSnapshot): BaseballSnapshot {
  if (data.schemaVersion !== 1 || data.gameType !== "R" || !Number.isInteger(data.season) ||
      !Number.isFinite(Date.parse(data.updatedAt)) || !Number.isFinite(Date.parse(data.regularSeasonEnd)) ||
      typeof data.seasonComplete !== "boolean" || data.teams.length !== 30 || new Set(data.teams.map(t => t.id)).size !== 30) throw new Error("Invalid MLB snapshot");
  const divisions = new Map<string, number>();
  for (const team of data.teams) {
    const counts = [team.gamesPlayed, team.wins, team.losses, team.runsFor, team.runsAgainst, team.hits, team.atBats, team.homeRuns, team.divisionRank];
    if (!/^\d+$/.test(team.id) || !team.name || !team.abbreviation || !["American League", "National League"].includes(team.league) ||
        !["East", "Central", "West"].includes(team.division) || counts.some(n => !Number.isInteger(n) || n < 0) ||
        team.divisionRank < 1 || team.divisionRank > 5 || team.gamesPlayed !== team.wins + team.losses || team.gamesPlayed > 163 ||
        team.hits > team.atBats || team.homeRuns > team.hits || !Number.isFinite(team.battingAverage) || team.battingAverage < 0 || team.battingAverage > 1 ||
        !Number.isFinite(team.era) || team.era < 0 || (team.atBats && Math.abs(team.battingAverage - team.hits / team.atBats) > .001)) throw new Error(`Invalid MLB team: ${team.name}`);
    const key = `${team.league} ${team.division}`; divisions.set(key, (divisions.get(key) ?? 0) + 1);
  }
  if (divisions.size !== 6 || [...divisions.values()].some(n => n !== 5) ||
      data.completedGames !== data.teams.reduce((sum, t) => sum + t.gamesPlayed, 0) / 2 ||
      data.teams.reduce((sum, t) => sum + t.wins, 0) !== data.teams.reduce((sum, t) => sum + t.losses, 0) ||
      data.totalHomeRuns !== data.teams.reduce((sum, t) => sum + t.homeRuns, 0)) throw new Error("Inconsistent MLB totals");
  for (const category of ["homeRuns", "battingAverage", "wins", "losses"] as const) {
    const leaders = data.leaders[category];
    if (!Array.isArray(leaders)) throw new Error(`Missing MLB leaders: ${category}`);
    if (data.completedGames && !leaders.length) throw new Error(`Missing MLB leaders: ${category}`);
    if (new Set(leaders.map(p => p.id)).size !== leaders.length || leaders.some(p => !/^\d+$/.test(p.id) || !p.name || !p.team || !Number.isFinite(p.value) || p.value < 0 ||
        (category === "battingAverage" ? p.value > 1 : !Number.isInteger(p.value))) || leaders.some(p => p.value !== leaders[0].value)) throw new Error(`Invalid MLB leaders: ${category}`);
  }
  return data;
}
