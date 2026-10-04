import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildHockeySnapshot } from "../lib/nhl-model.ts";
function fixture(rounds = 5) {
  const teams = Array.from({ length: 32 }, (_, i) => ({ id: String(i), name: `Team ${i}`, abbreviation: `T${i}`, conference: "East", division: "Atlantic",
    gamesPlayed: 0, wins: 0, losses: 0, overtimeLosses: 0, points: 0, goalsFor: 0, goalsAgainst: 0, regulationWins: 0 }));
  const games = [];
  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < 32; i += 2) {
      const decision = ["REG", "OT", "SO"][round % 3];
      const home = teams[i], away = teams[i + 1];
      games.push({ id: `${round}-${i}`, date: `2026-10-${String(round + 1).padStart(2, "0")}T23:00:00Z`, homeId: home.id, awayId: away.id,
        home: home.abbreviation, away: away.abbreviation, completed: true, state: "OFF", homeScore: 3, awayScore: 2, decision });
      home.gamesPlayed++; home.wins++; home.points += 2; home.goalsFor += 3; home.goalsAgainst += 2;
      if (decision === "REG") home.regulationWins++;
      away.gamesPlayed++; away.goalsFor += 2; away.goalsAgainst += 3;
      if (decision === "REG") away.losses++; else { away.overtimeLosses++; away.points++; }
    }
  }
  return { teams, games };
}
const build = ({ teams, games }) => buildHockeySnapshot(teams, games, 20262027, "2026-10-06T00:00:00Z");
test("NHL activation requires every team's fifth regular-season final", () => {
  const pending = build(fixture(4));
  assert.equal(pending.rankingsReady, false);
  assert.equal(pending.rankings.length, 0);
  const ready = build(fixture());
  assert.equal(ready.rankingsReady, true);
  assert.equal(ready.teamsReady, 32);
  assert.equal(ready.rankings.length, 32);
  assert.deepEqual(ready.rankings.map(t => t.rank), Array.from({ length: 32 }, (_, i) => i + 1));
  assert.ok(ready.rankings.every(t => t.score >= 0 && t.score <= 100));
});
test("OT and shootout losses preserve points and recent-form credit", () => {
  const snapshot = build(fixture());
  const losing = snapshot.rankings.find(t => t.id === "1");
  assert.equal(losing.losses, 2);
  assert.equal(losing.overtimeLosses, 3);
  assert.equal(losing.points, 3);
  assert.equal(losing.components.record, 30);
  assert.equal(losing.components.momentum, 30);
  assert.deepEqual(losing.recent, ["OTL", "L", "OTL", "OTL", "L"]);
});
test("incomplete rosters, duplicate games, and standings lag cannot publish", () => {
  const missing = fixture(); missing.teams.pop(); assert.throws(() => build(missing));
  const duplicate = fixture(); duplicate.games.push(duplicate.games[0]); assert.throws(() => build(duplicate));
  const lag = fixture(); lag.games.pop(); assert.throws(() => build(lag), /disagree/);
});
test("upcoming games do not count toward activation", () => {
  const pending = fixture(4);
  pending.games.push({ id: "future", date: "2026-10-20T23:00:00Z", homeId: "0", awayId: "1", home: "T0", away: "T1", completed: false, state: "FUT", homeScore: null, awayScore: null, decision: null });
  const snapshot = build(pending);
  assert.equal(snapshot.completedGames, 64);
  assert.equal(snapshot.rankingsReady, false);
});
test("NHL browser page never calls the remote feed", async () => {
  assert.doesNotMatch(await readFile("app/nhl/page.tsx", "utf8"), /https?:\/\//);
});
