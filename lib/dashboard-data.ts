import { readLocalData } from "./local-data";
import type { DashboardData, DistanceRecord, ScopeDashboard, TeamMetric } from "@/lib/dashboard-types";

type TeamInfo = { id: string; name: string; abbreviation: string };
type Game = {
  id: string;
  week: number;
  home: TeamInfo;
  away: TeamInfo;
  homeScore: number;
  awayScore: number;
};
type ScoringPlay = {
  gameId: string;
  week: number;
  teamId: string;
  text: string;
  type: string;
};

function yardsFrom(text: string) {
  const match = text.match(/(\d+)\s+Yd\b/i);
  return match ? Number(match[1]) : 0;
}

function playerFrom(text: string) {
  return text.match(/^(.+?)\s+\d+\s+Yd\b/i)?.[1]?.trim() ?? "Unknown player";
}

function touchdownCategory(type: string, text: string) {
  const value = `${type} ${text}`.toLowerCase();
  if (!value.includes("touchdown")) return null;
  if (value.includes("passing touchdown") || /\bpass from\b/i.test(text)) return "receiving" as const;
  if (value.includes("rushing touchdown") || /\byd rush\b/i.test(text)) return "rushing" as const;
  if (value.includes("interception") || value.includes("fumble return") || value.includes("sack opp fumble")) return "defensive" as const;
  if (value.includes("kickoff") || value.includes("punt return") || value.includes("blocked")) return "specialTeams" as const;
  return "receiving" as const;
}

async function inBatches<T, R>(items: T[], size: number, work: (item: T) => Promise<R>) {
  const results: R[] = [];
  for (let index = 0; index < items.length; index += size) {
    results.push(...await Promise.all(items.slice(index, index + size).map(work)));
  }
  return results;
}

async function fetchGames(season: number, throughWeek: number, signal?: AbortSignal): Promise<Game[]> {
  const weeks = await Promise.all(Array.from({ length: throughWeek }, (_, index) => index + 1).map(async (week) => {
    const response = await readLocalData(`${season}/week-${week}.json`, signal);
    return { week, payload: response as { events?: Array<Record<string, unknown>> } };
  }));

  return weeks.flatMap(({ week, payload }) => (payload.events ?? []).flatMap((event) => {
    const status = event.status as { type?: { completed?: boolean } } | undefined;
    if (!status?.type?.completed) return [];
    const competition = (event.competitions as Array<Record<string, unknown>> | undefined)?.[0];
    const competitors = competition?.competitors as Array<Record<string, unknown>> | undefined;
    const home = competitors?.find((item) => item.homeAway === "home");
    const away = competitors?.find((item) => item.homeAway === "away");
    if (!home || !away) return [];
    const homeTeam = home.team as Record<string, string>;
    const awayTeam = away.team as Record<string, string>;
    return [{
      id: String(event.id),
      week,
      home: { id: String(homeTeam.id), name: homeTeam.displayName, abbreviation: homeTeam.abbreviation },
      away: { id: String(awayTeam.id), name: awayTeam.displayName, abbreviation: awayTeam.abbreviation },
      homeScore: Number(home.score),
      awayScore: Number(away.score),
    }];
  }));
}

async function fetchScoringPlays(games: Game[], season: number, signal?: AbortSignal): Promise<ScoringPlay[]> {
  const summaries = await inBatches(games, 12, async (game) => {
    const response = await readLocalData(`${season}/summaries/${game.id}.json`, signal);
    const payload = response as { scoringPlays?: Array<Record<string, unknown>> };
    const plays = (payload.scoringPlays ?? []).map((play) => ({
      gameId: game.id,
      week: game.week,
      teamId: String((play.team as Record<string, string> | undefined)?.id ?? ""),
      text: String(play.text ?? ""),
      type: String((play.type as Record<string, string> | undefined)?.text ?? ""),
    }));
    return plays;
  });
  return summaries.flat();
}

function aggregate(games: Game[], plays: ScoringPlay[]): ScopeDashboard {
  const teams = new Map<string, { info: TeamInfo; games: number; pointsFor: number; pointsAgainst: number; touchdowns: number }>();
  const ensure = (team: TeamInfo) => {
    if (!teams.has(team.id)) teams.set(team.id, { info: team, games: 0, pointsFor: 0, pointsAgainst: 0, touchdowns: 0 });
    return teams.get(team.id)!;
  };
  for (const game of games) {
    const home = ensure(game.home);
    const away = ensure(game.away);
    home.games += 1; home.pointsFor += game.homeScore; home.pointsAgainst += game.awayScore;
    away.games += 1; away.pointsFor += game.awayScore; away.pointsAgainst += game.homeScore;
  }

  const touchdowns = { receiving: 0, rushing: 0, defensive: 0, specialTeams: 0 };
  let fieldGoals = 0;
  let safeties = 0;
  let longestTouchdown: DistanceRecord = null;
  let longestFieldGoal: DistanceRecord = null;
  const gameById = new Map(games.map((game) => [game.id, game]));

  for (const play of plays) {
    const category = touchdownCategory(play.type, play.text);
    const game = gameById.get(play.gameId);
    const scoringTeam = teams.get(play.teamId)?.info;
    const opponent = game && scoringTeam ? (game.home.id === scoringTeam.id ? game.away : game.home) : null;
    const yards = yardsFrom(play.text);
    if (category) {
      touchdowns[category] += 1;
      const team = teams.get(play.teamId);
      if (team) team.touchdowns += 1;
      if (!longestTouchdown || yards > longestTouchdown.yards) longestTouchdown = { player: playerFrom(play.text), team: scoringTeam?.abbreviation ?? "—", opponent: opponent?.abbreviation ?? "—", yards, week: play.week, description: play.text };
    }
    if (play.type.toLowerCase().includes("field goal good")) {
      fieldGoals += 1;
      if (!longestFieldGoal || yards > longestFieldGoal.yards) longestFieldGoal = { player: playerFrom(play.text), team: scoringTeam?.abbreviation ?? "—", opponent: opponent?.abbreviation ?? "—", yards, week: play.week, description: play.text };
    }
    if (`${play.type} ${play.text}`.toLowerCase().includes("safety")) safeties += 1;
  }

  const teamRows = [...teams.values()];
  const metric = (row: typeof teamRows[number] | undefined, value: number): TeamMetric | null => row ? { team: row.info.name, abbreviation: row.info.abbreviation, value } : null;
  const mostPointsRow = [...teamRows].sort((a, b) => b.pointsFor - a.pointsFor)[0];
  const bestScoringRow = [...teamRows].sort((a, b) => b.pointsFor / b.games - a.pointsFor / a.games)[0];
  const bestDefenseRow = [...teamRows].sort((a, b) => a.pointsAgainst / a.games - b.pointsAgainst / b.games)[0];
  const mostTdRow = [...teamRows].sort((a, b) => b.touchdowns - a.touchdowns)[0];
  const totalPoints = games.reduce((sum, game) => sum + game.homeScore + game.awayScore, 0);
  const byCombined = [...games].sort((a, b) => (b.homeScore + b.awayScore) - (a.homeScore + a.awayScore))[0];
  const byMargin = [...games].sort((a, b) => Math.abs(b.homeScore - b.awayScore) - Math.abs(a.homeScore - a.awayScore))[0];
  const byClosest = [...games].sort((a, b) => Math.abs(a.homeScore - a.awayScore) - Math.abs(b.homeScore - b.awayScore))[0];
  const gameMetric = (game: Game | undefined, value: number) => game ? { matchup: `${game.away.abbreviation} at ${game.home.abbreviation}`, score: `${game.awayScore}–${game.homeScore}`, value, week: game.week } : null;

  return {
    games: games.length,
    averageTeamScore: games.length ? totalPoints / (games.length * 2) : 0,
    averageGameScore: games.length ? totalPoints / games.length : 0,
    mostPoints: metric(mostPointsRow, mostPointsRow?.pointsFor ?? 0),
    bestScoringAverage: metric(bestScoringRow, bestScoringRow ? bestScoringRow.pointsFor / bestScoringRow.games : 0),
    bestDefenseAverage: metric(bestDefenseRow, bestDefenseRow ? bestDefenseRow.pointsAgainst / bestDefenseRow.games : 0),
    mostTouchdowns: metric(mostTdRow, mostTdRow?.touchdowns ?? 0),
    highestScoringGame: gameMetric(byCombined, byCombined ? byCombined.homeScore + byCombined.awayScore : 0),
    largestVictory: gameMetric(byMargin, byMargin ? Math.abs(byMargin.homeScore - byMargin.awayScore) : 0),
    closestGame: gameMetric(byClosest, byClosest ? Math.abs(byClosest.homeScore - byClosest.awayScore) : 0),
    touchdowns,
    fieldGoals,
    safeties,
    longestTouchdown,
    longestFieldGoal,
  };
}

export async function fetchDashboardData(season: number, week: number, signal?: AbortSignal): Promise<DashboardData> {
  const games = await fetchGames(season, week, signal);
  const plays = await fetchScoringPlays(games, season, signal);
  const weekGames = games.filter((game) => game.week === week);
  const weekIds = new Set(weekGames.map((game) => game.id));
  return {
    season,
    week,
    generatedAt: new Date().toISOString(),
    weekStats: aggregate(weekGames, plays.filter((play) => weekIds.has(play.gameId))),
    seasonStats: aggregate(games, plays),
  };
}
