import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { buildHockeySnapshot, validateHockeyClubStats } from "../lib/nhl-model.ts";

import { hockeyMvps } from "./league-mvp-model.mjs";

async function request(path) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const response = await fetch(`https://api-web.nhle.com/v1/${path}`, { signal: AbortSignal.timeout(30000) });
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after"));
        await new Promise(resolve => setTimeout(resolve, Math.max(5000 * (attempt + 1), Number.isFinite(retryAfter) ? retryAfter * 1000 : 0)));
      }
      if (!response.ok) throw new Error(`NHL HTTP ${response.status}: ${path}`);
      return await response.json();
    } catch (error) {
      if (attempt === 4) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}
const standings = await request("standings/now");
if (!Array.isArray(standings.standings) || standings.standings.length !== 32) throw new Error("Missing NHL teams");
const season = standings.standings[0].seasonId;
if (standings.standings.some(t => t.seasonId !== season)) throw new Error("Mixed NHL seasons");
const teams = standings.standings.map(t => ({
  id: "", name: t.teamName?.default, abbreviation: t.teamAbbrev?.default,
  conference: t.conferenceName, division: t.divisionName,
  gamesPlayed: t.gamesPlayed, wins: t.wins, losses: t.losses, overtimeLosses: t.otLosses,
  points: t.points, goalsFor: t.goalFor, goalsAgainst: t.goalAgainst, regulationWins: t.regulationWins,
}));
const games = new Map();
// Small batches keep the source request load bounded.
for (let i = 0; i < teams.length; i += 2) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  await Promise.all(teams.slice(i, i + 2).map(async team => {
    if (!/^[A-Z]{2,3}$/.test(team.abbreviation)) throw new Error("Invalid NHL abbreviation");
    const schedule = await request(`club-schedule-season/${team.abbreviation}/${season}`);
    if (!Array.isArray(schedule.games) || !schedule.games.length) throw new Error(`Missing schedule: ${team.abbreviation}`);
    const participant = schedule.games.flatMap(g => [g.homeTeam, g.awayTeam]).find(t => t.abbrev === team.abbreviation);
    if (!participant?.id) throw new Error(`Missing team ID: ${team.abbreviation}`);
    team.id = String(participant.id);
    for (const g of schedule.games.filter(g => g.gameType === 2)) {
      if (g.season !== season) throw new Error("Wrong schedule season");
      const completed = ["FINAL", "OFF"].includes(g.gameState);
      const decision = completed ? g.gameOutcome?.lastPeriodType : null;
      if (completed && !["REG", "OT", "SO"].includes(decision)) throw new Error(`Missing decision: ${g.id}`);
      const normalized = { id: String(g.id), date: g.startTimeUTC, homeId: String(g.homeTeam.id), awayId: String(g.awayTeam.id),
        home: g.homeTeam.abbrev, away: g.awayTeam.abbrev, completed, state: g.gameState,
        homeScore: completed ? g.homeTeam.score : null, awayScore: completed ? g.awayTeam.score : null, decision };
      if (games.has(normalized.id) && JSON.stringify(games.get(normalized.id)) !== JSON.stringify(normalized)) throw new Error(`Inconsistent NHL game: ${g.id}`);
      games.set(normalized.id, normalized);
    }
  }));
}
if (!games.size) throw new Error("Empty NHL regular-season schedule");
for (let i = 0; i < teams.length; i += 2) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  await Promise.all(teams.slice(i, i + 2).map(async team => {
    const stats = await request(`club-stats/${team.abbreviation}/${season}/2`);
    if (Number(stats.season) !== season || stats.gameType !== 2 || !Array.isArray(stats.skaters) || !Array.isArray(stats.goalies)) throw new Error(`Invalid club stats: ${team.abbreviation}`);
    team.players = stats.skaters.map(p => ({ id: String(p.playerId), name: `${p.firstName.default} ${p.lastName.default}`, position: p.positionCode, gamesPlayed: p.gamesPlayed, goals: p.goals, assists: p.assists, points: p.points, shots: p.shots }));
    team.goalies = stats.goalies.map(p => ({ id: String(p.playerId), name: `${p.firstName.default} ${p.lastName.default}`, gamesPlayed: p.gamesPlayed, shotsAgainst: p.shotsAgainst, saves: p.saves, goalsAgainst: p.goalsAgainst, shutouts: p.shutouts, timeOnIce: p.timeOnIce }));
    validateHockeyClubStats(team);
  }));
}
const snapshot = buildHockeySnapshot(teams, [...games.values()], season, new Date().toISOString());
snapshot.mvps = hockeyMvps(teams);
let previous;
try { previous = JSON.parse(await readFile("public/data/nhl/current.json", "utf8")); } catch {}
if (previous?.season === season && (snapshot.games.length < previous.games.length || snapshot.completedGames < previous.completedGames)) {
  throw new Error("Refusing truncated NHL snapshot");
}
await mkdir("public/data/nhl", { recursive: true });
await writeFile("public/data/nhl/current.json.tmp", JSON.stringify(snapshot));
await rename("public/data/nhl/current.json.tmp", "public/data/nhl/current.json");
console.log(`Stored NHL ${season}: ${snapshot.completedGames} finals; ${snapshot.teamsReady}/32 teams have five games`);
