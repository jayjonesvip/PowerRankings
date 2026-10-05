import type { LeagueMvps } from "./league-mvp";
export type HockeyPlayer = { id: string; name: string; position: string; gamesPlayed: number; goals: number; assists: number; points: number; shots: number };
export type HockeyGoalie = { id: string; name: string; gamesPlayed: number; shotsAgainst: number; saves: number; goalsAgainst: number; shutouts: number; timeOnIce: number };
export type HockeyTeam = {
  id: string; name: string; abbreviation: string; conference: string; division: string;
  gamesPlayed: number; wins: number; losses: number; overtimeLosses: number;
  players?: HockeyPlayer[]; goalies?: HockeyGoalie[];
  points: number; goalsFor: number; goalsAgainst: number; regulationWins: number;
};
export type HockeyGame = {
  id: string; date: string; homeId: string; awayId: string; home: string; away: string;
  completed: boolean; state: string; homeScore: number | null; awayScore: number | null;
  decision: "REG" | "OT" | "SO" | null;
};
export type HockeyRank = HockeyTeam & {
  rank: number; score: number; goalsForAverage: number; goalsAgainstAverage: number;
  components: { record: number; quality: number; offense: number; defense: number; momentum: number };
  recent: string[];
};
export type HockeySnapshot = {
  mvps?: LeagueMvps;
  schemaVersion: number; season: number; updatedAt: string; rankingsReady: boolean;
  minimumGames: number; teamsReady: number; completedGames: number;
  teams: HockeyTeam[]; games: HockeyGame[]; rankings: HockeyRank[];
};

export function buildHockeySnapshot(teams: HockeyTeam[], games: HockeyGame[], season: number, updatedAt: string): HockeySnapshot {
  if (teams.length !== 32 || new Set(teams.map(t => t.id)).size !== 32 || new Set(teams.map(t => t.abbreviation)).size !== 32) {
    throw new Error("Expected 32 unique NHL teams");
  }
  if (!Number.isFinite(Date.parse(updatedAt)) || !Number.isInteger(season)) throw new Error("Invalid NHL snapshot metadata");
  const numeric = ["gamesPlayed", "wins", "losses", "overtimeLosses", "points", "goalsFor", "goalsAgainst", "regulationWins"] as const;
  for (const team of teams) {
    if (!team.name || !team.abbreviation || numeric.some(key => !Number.isInteger(team[key]) || team[key] < 0) ||
        team.gamesPlayed !== team.wins + team.losses + team.overtimeLosses || team.points > 2 * team.gamesPlayed || team.regulationWins > team.wins) {
      throw new Error(`Invalid NHL standings: ${team.abbreviation}`);
    }
  }
  const ids = new Set(teams.map(t => t.id));
  const gameIds = new Set<string>();
  for (const game of games) {
    if (!game.id || gameIds.has(game.id) || !Number.isFinite(Date.parse(game.date)) ||
        !ids.has(game.homeId) || !ids.has(game.awayId) || game.homeId === game.awayId ||
        (game.completed && (game.homeScore === null || game.awayScore === null ||
          !Number.isInteger(game.homeScore) || !Number.isInteger(game.awayScore) ||
          game.homeScore < 0 || game.awayScore < 0 || game.homeScore === game.awayScore || !game.decision))) {
      throw new Error(`Invalid NHL game: ${game.id}`);
    }
    gameIds.add(game.id);
  }
  const finals = games.filter(g => g.completed).sort((a, b) => a.date.localeCompare(b.date));
  const logs = new Map(teams.map(team => [team.id, finals.filter(g => g.homeId === team.id || g.awayId === team.id)]));
  for (const team of teams) {
    if (logs.get(team.id)!.length !== team.gamesPlayed) throw new Error(`NHL standings/schedule disagree: ${team.abbreviation}`);
  }
  const gp = teams.reduce((sum, team) => sum + team.gamesPlayed, 0);
  const average = gp ? teams.reduce((sum, team) => sum + team.goalsFor, 0) / gp : 3;
  const curve = (difference: number) => 50 + 50 * Math.tanh(difference / 1.25);
  const strengths = new Map(teams.map(t => [t.id, t.gamesPlayed ? t.points / (2 * t.gamesPlayed) * 100 : 50]));
  const ranked = teams.map(team => {
    const log = logs.get(team.id)!;
    const gf = team.gamesPlayed ? team.goalsFor / team.gamesPlayed : 0;
    const ga = team.gamesPlayed ? team.goalsAgainst / team.gamesPlayed : 0;
    const outcome = (g: HockeyGame) => {
      const home = g.homeId === team.id;
      const forGoals = home ? g.homeScore! : g.awayScore!;
      const againstGoals = home ? g.awayScore! : g.homeScore!;
      return { won: forGoals > againstGoals, margin: forGoals - againstGoals, opponentId: home ? g.awayId : g.homeId };
    };
    const victories = log.map(outcome).filter(g => g.won);
    const recent = log.slice(-5);
    const components = {
      record: strengths.get(team.id)!,
      quality: victories.length ? victories.reduce((sum, g) => sum + strengths.get(g.opponentId)! * 0.8 + curve(g.margin) * 0.2, 0) / victories.length : 0,
      offense: team.gamesPlayed ? curve(gf - average) : 50,
      defense: team.gamesPlayed ? curve(average - ga) : 50,
      momentum: recent.length ? recent.reduce((sum, g) => sum + (outcome(g).won ? 100 : g.decision !== "REG" ? 50 : 0), 0) / recent.length : 50,
    };
    return { ...team, rank: 0, score: components.record * .25 + components.quality * .30 + components.offense * .20 + components.defense * .20 + components.momentum * .05,
      goalsForAverage: gf, goalsAgainstAverage: ga, components,
      recent: recent.reverse().map(g => outcome(g).won ? "W" : g.decision !== "REG" ? "OTL" : "L") };
  }).sort((a, b) => b.score - a.score || b.points - a.points || b.regulationWins - a.regulationWins || a.abbreviation.localeCompare(b.abbreviation));
  const minimumGames = 5;
  const teamsReady = teams.filter(t => t.gamesPlayed >= minimumGames).length;
  return { schemaVersion: 1, season, updatedAt, minimumGames, teamsReady, rankingsReady: teamsReady === teams.length,
    completedGames: finals.length, teams, games: [...games].sort((a, b) => a.date.localeCompare(b.date)),
    rankings: teamsReady === teams.length ? ranked.map((t, i) => ({ ...t, rank: i + 1 })) : [] };
}

export function validateHockeyClubStats(team: HockeyTeam) {
  if (!team.players || !team.goalies) throw new Error(`Missing club stats: ${team.abbreviation}`);
  for (const group of [team.players, team.goalies]) {
    if (new Set(group.map(p=>p.id)).size !== group.length) throw new Error("Duplicate club player");
    for (const player of group) {
      if (!player.id || !player.name || !Number.isInteger(player.gamesPlayed) || player.gamesPlayed < 0 || player.gamesPlayed > team.gamesPlayed) throw new Error("Invalid club appearance count");
    }
  }
  for (const player of team.players) {
    if (![player.goals,player.assists,player.points,player.shots].every(n=>Number.isInteger(n)&&n>=0) || player.points !== player.goals+player.assists) throw new Error("Invalid club scoring totals");
  }
  for (const goalie of team.goalies) {
    if (![goalie.saves,goalie.shotsAgainst,goalie.goalsAgainst,goalie.shutouts,goalie.timeOnIce].every(n=>Number.isInteger(n)&&n>=0) || goalie.saves > goalie.shotsAgainst) throw new Error("Invalid club goalie totals");
  }
  if (team.gamesPlayed > 0 && (!team.players.length || !team.goalies.length)) throw new Error("Missing played club statistics");
}
