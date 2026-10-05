import { readLocalData } from "./local-data.ts";
export type Game = {
  id: string; week: number; date: string;
  homeId: string; awayId: string; homeName: string; awayName: string;
  homeAbbreviation: string; awayAbbreviation: string; homeColor: string; awayColor: string;
  homeAlternateColor: string; awayAlternateColor: string;
  homeScore: number; awayScore: number;
};

export type RankedTeam = {
  id: string; name: string; abbreviation: string; color: string; alternateColor: string;
  rank: number; previousRank: number; movement: number; score: number;
  wins: number; losses: number; ties: number; pointsFor: number; pointsAgainst: number;
  components: { record: number; quality: number; offense: number; defense: number; momentum: number };
  summary: string;
  recentGames: Array<{ id: string; result: "W" | "L" | "T"; opponent: string; pointsFor: number; pointsAgainst: number }>;
};

export type SeasonSnapshot = { week: number; completedGames: number; teams: RankedTeam[] };
export type ScheduledGame = {
  id: string; date: string; neutralSite: boolean;
  homeId: string; awayId: string; homeName: string; awayName: string;
  homeAbbreviation: string; awayAbbreviation: string;
};
type TeamSeed = { id: string; name: string; abbreviation: string; color: string; alternateColor: string };
type TeamGame = { id: string; week: number; opponentId: string; opponent: string; pointsFor: number; pointsAgainst: number; margin: number; result: number };


const bounded = (value: number) => Math.max(0, Math.min(100, value));
const curve = (difference: number, scale: number) => 50 + 50 * Math.tanh(difference / scale);
const safeColor = (value: string | undefined) => value && /^[0-9a-f]{6}$/i.test(value) ? value : "34413e";

export async function fetchWeekSchedule(season: number, week: number, signal?: AbortSignal): Promise<ScheduledGame[]> {
  if (week < 1 || week > 18) return [];
  const response = await readLocalData(`${season}/week-${week}.json`, signal);
  const data = response as { events?: Array<Record<string, unknown>> };
  return (data.events ?? []).flatMap((event) => {
    const competition = (event.competitions as Array<Record<string, unknown>> | undefined)?.[0];
    const competitors = competition?.competitors as Array<Record<string, unknown>> | undefined;
    const home = competitors?.find((item) => item.homeAway === "home");
    const away = competitors?.find((item) => item.homeAway === "away");
    if (!home || !away) return [];
    const homeTeam = home.team as Record<string, string>;
    const awayTeam = away.team as Record<string, string>;
    return [{
      id: String(event.id),
      date: String(event.date),
      neutralSite: Boolean(competition?.neutralSite),
      homeId: String(homeTeam.id),
      awayId: String(awayTeam.id),
      homeName: homeTeam.displayName,
      awayName: awayTeam.displayName,
      homeAbbreviation: homeTeam.abbreviation,
      awayAbbreviation: awayTeam.abbreviation,
    }];
  }).sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchSeasonGames(season: number, readData: typeof readLocalData = readLocalData): Promise<Game[]> {
  const responses = await Promise.all(Array.from({ length: 18 }, (_, index) => index + 1).map(async (week) => {
    const response = await readData(`${season}/week-${week}.json`);
    return { week, data: response as { events?: Array<Record<string, unknown>> } };
  }));

  return responses.flatMap(({ week, data }) => (data.events ?? []).flatMap((event) => {
    const status = event.status as { type?: { completed?: boolean } } | undefined;
    if (!status?.type?.completed) return [];
    const competition = (event.competitions as Array<Record<string, unknown>> | undefined)?.[0];
    const competitors = competition?.competitors as Array<Record<string, unknown>> | undefined;
    if (!competitors || competitors.length !== 2) return [];
    const home = competitors.find((item) => item.homeAway === "home");
    const away = competitors.find((item) => item.homeAway === "away");
    if (!home || !away) return [];
    const homeTeam = home.team as Record<string, string>;
    const awayTeam = away.team as Record<string, string>;
    return [{
      id: String(event.id), week, date: String(event.date),
      homeId: String(homeTeam.id), awayId: String(awayTeam.id),
      homeName: homeTeam.displayName, awayName: awayTeam.displayName,
      homeAbbreviation: homeTeam.abbreviation, awayAbbreviation: awayTeam.abbreviation,
      homeColor: safeColor(homeTeam.color), awayColor: safeColor(awayTeam.color),
      homeAlternateColor: safeColor(homeTeam.alternateColor), awayAlternateColor: safeColor(awayTeam.alternateColor),
      homeScore: Number(home.score), awayScore: Number(away.score),
    }];
  })).sort((a, b) => a.date.localeCompare(b.date));
}

function rankThroughWeek(games: Game[], week: number, previous?: RankedTeam[]): RankedTeam[] {
  const eligible = games.filter((game) => game.week <= week);
  const seeds = new Map<string, TeamSeed>();
  const logs = new Map<string, TeamGame[]>();
  const addTeam = (seed: TeamSeed, game: TeamGame) => { seeds.set(seed.id, seed); logs.set(seed.id, [...(logs.get(seed.id) ?? []), game]); };

  for (const game of eligible) {
    const tie = game.homeScore === game.awayScore;
    addTeam(
      { id: game.homeId, name: game.homeName, abbreviation: game.homeAbbreviation, color: game.homeColor, alternateColor: game.homeAlternateColor },
      { id: game.id, week: game.week, opponentId: game.awayId, opponent: game.awayAbbreviation, pointsFor: game.homeScore, pointsAgainst: game.awayScore, margin: game.homeScore - game.awayScore, result: tie ? 0.5 : game.homeScore > game.awayScore ? 1 : 0 },
    );
    addTeam(
      { id: game.awayId, name: game.awayName, abbreviation: game.awayAbbreviation, color: game.awayColor, alternateColor: game.awayAlternateColor },
      { id: game.id, week: game.week, opponentId: game.homeId, opponent: game.homeAbbreviation, pointsFor: game.awayScore, pointsAgainst: game.homeScore, margin: game.awayScore - game.homeScore, result: tie ? 0.5 : game.awayScore > game.homeScore ? 1 : 0 },
    );
  }

  const leagueGames = [...logs.values()].flat();
  const leaguePoints = leagueGames.length ? leagueGames.reduce((sum, game) => sum + game.pointsFor, 0) / leagueGames.length : 21;
  const teamMetrics = new Map([...seeds.keys()].map((id) => {
    const teamGames = logs.get(id) ?? [];
    const wins = teamGames.filter((game) => game.result === 1).length;
    const ties = teamGames.filter((game) => game.result === 0.5).length;
    const pointsFor = teamGames.reduce((sum, game) => sum + game.pointsFor, 0);
    const pointsAgainst = teamGames.reduce((sum, game) => sum + game.pointsAgainst, 0);
    const record = teamGames.length ? ((wins + ties * 0.5) / teamGames.length) * 100 : 50;
    const offense = bounded(curve((teamGames.length ? pointsFor / teamGames.length : leaguePoints) - leaguePoints, 7));
    const defense = bounded(curve(leaguePoints - (teamGames.length ? pointsAgainst / teamGames.length : leaguePoints), 7));
    // Opponent strength deliberately excludes "quality of win" to avoid a circular score.
    // It is an independent measure of what that opponent has done on the field.
    const baseStrength = record * 0.50 + offense * 0.25 + defense * 0.25;
    return [id, { record, offense, defense, baseStrength }] as const;
  }));

  const provisional = [...seeds.values()].map((seed) => {
    const teamGames = logs.get(seed.id) ?? [];
    const wins = teamGames.filter((game) => game.result === 1).length;
    const losses = teamGames.filter((game) => game.result === 0).length;
    const ties = teamGames.length - wins - losses;
    const pointsFor = teamGames.reduce((sum, game) => sum + game.pointsFor, 0);
    const pointsAgainst = teamGames.reduce((sum, game) => sum + game.pointsAgainst, 0);
    const metrics = teamMetrics.get(seed.id) ?? { record: 50, offense: 50, defense: 50, baseStrength: 50 };
    const victories = teamGames.filter((game) => game.result === 1);
    const quality = victories.length ? victories.reduce((sum, game) => {
      const opponentStrength = teamMetrics.get(game.opponentId)?.baseStrength ?? 50;
      const marginScore = curve(game.margin, 14);
      return sum + opponentStrength * 0.80 + marginScore * 0.20;
    }, 0) / victories.length : 0;
    const recent = teamGames.slice(-3);
    const momentum = recent.length ? recent.reduce((sum, game) => sum + game.result * 60 + curve(game.margin, 14) * 0.4, 0) / recent.length : 50;
    const components = {
      record: bounded(metrics.record),
      quality: bounded(quality),
      offense: metrics.offense,
      defense: metrics.defense,
      momentum: bounded(momentum),
    };
    const score = components.record * 0.25 + components.quality * 0.30 + components.offense * 0.20 + components.defense * 0.20 + components.momentum * 0.05;
    const pointDiff = pointsFor - pointsAgainst;
    const profile = components.offense - components.defense > 12 ? "The offense is carrying more of the load than the defense." : components.defense - components.offense > 12 ? "Its defense is the stronger half of the team." : "The offense and defense have contributed at a similar level.";
    return {
      ...seed, rank: 0, previousRank: 0, movement: 0, score, wins, losses, ties, pointsFor, pointsAgainst, components, summary: "", profile, pointDiff,
      recentGames: teamGames.slice(-3).reverse().map((game) => ({ id: `${game.id}-${seed.id}`, result: game.result === 1 ? "W" as const : game.result === 0 ? "L" as const : "T" as const, opponent: game.opponent, pointsFor: game.pointsFor, pointsAgainst: game.pointsAgainst })),
    };
  }).sort((a, b) => b.score - a.score || b.wins - a.wins || (b.pointsFor - b.pointsAgainst) - (a.pointsFor - a.pointsAgainst));

  const ranked = provisional.map((team, index) => {
    const rank = index + 1;
    const previousRank = previous?.find((item) => item.id === team.id)?.rank ?? rank;
    return { ...team, rank, previousRank, movement: previousRank - rank };
  });
  const rankById = new Map(ranked.map((team) => [team.id, team.rank]));

  return ranked.map((team) => {
    const victories = (logs.get(team.id) ?? []).filter((game) => game.result === 1);
    const opponents = victories.map((game) => `${game.opponent} (#${rankById.get(game.opponentId) ?? "—"})`);
    const qualitySentence = opponents.length
      ? `Its ${opponents.length === 1 ? "win came" : "wins came"} against ${opponents.join(opponents.length > 2 ? ", " : " and ")}, producing a ${team.components.quality.toFixed(1)} win-quality score.`
      : "It has no wins contributing to its win-quality score.";
    const summary = `${team.name} is ${team.wins}–${team.losses}${team.ties ? `–${team.ties}` : ""} with a ${team.pointDiff >= 0 ? "+" : ""}${team.pointDiff} point differential. ${qualitySentence} ${team.profile}`;
    return { ...team, summary };
  });
}

export function buildSnapshots(games: Game[]): SeasonSnapshot[] {
  const lastWeek = Math.max(0, ...games.map((game) => game.week));
  const snapshots: SeasonSnapshot[] = [];
  for (let week = 1; week <= lastWeek; week += 1) {
    const teams = rankThroughWeek(games, week, snapshots.at(-1)?.teams);
    snapshots.push({ week, completedGames: games.filter((game) => game.week <= week).length, teams });
  }
  return snapshots;
}
