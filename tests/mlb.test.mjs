import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateBaseballSnapshot } from "../lib/mlb-model.ts";
function fixture() {
  const teams = Array.from({ length: 30 }, (_, i) => ({ id: String(i + 1), name: `Team ${i}`, abbreviation: `T${i}`, league: i < 15 ? "American League" : "National League",
    division: ["East", "Central", "West"][Math.floor((i % 15) / 5)], divisionRank: i % 5 + 1,
    gamesPlayed: 162, wins: 81, losses: 81, runsFor: 700, runsAgainst: 700, hits: 1250, atBats: 5000, battingAverage: .250, homeRuns: 180, era: 4.0 }));
  const leader = { id: "123", name: "Player", team: "Team 1", value: 45 };
  return { schemaVersion: 1, season: 2026, gameType: "R", updatedAt: "2026-10-05T12:00:00Z", regularSeasonEnd: "2026-09-27", seasonComplete: true,
    completedGames: 2430, totalHomeRuns: 5400, teams, leaders: { homeRuns: [leader], battingAverage: [{ ...leader, value: .320 }], wins: [{ ...leader, value: 20 }], losses: [{ ...leader, value: 18 }] } };
}
test("MLB snapshot validates regular-season totals and tied player leaders", () => {
  const data = fixture(); data.leaders.homeRuns.push({ ...data.leaders.homeRuns[0], id: "456", name: "Tied player" });
  assert.equal(validateBaseballSnapshot(data).leaders.homeRuns.length, 2);
  data.teams[0].wins++; data.teams[0].losses--; data.teams[1].wins--; data.teams[1].losses++;
  assert.equal(validateBaseballSnapshot(data).completedGames, 2430);
});
test("postseason, incomplete divisions, and inconsistent totals cannot publish", () => {
  const post = fixture(); post.gameType = "P"; assert.throws(() => validateBaseballSnapshot(post));
  const missing = fixture(); missing.teams.pop(); assert.throws(() => validateBaseballSnapshot(missing));
  const duplicate = fixture(); duplicate.teams[1].id = duplicate.teams[0].id; assert.throws(() => validateBaseballSnapshot(duplicate));
  const total = fixture(); total.totalHomeRuns++; assert.throws(() => validateBaseballSnapshot(total));
  const division = fixture(); division.teams[0].division = "Central"; assert.throws(() => validateBaseballSnapshot(division));
});
test("missing leaders and invalid batting/pitching values cannot silently become zero", () => {
  const empty = fixture(); delete empty.leaders.battingAverage; assert.throws(() => validateBaseballSnapshot(empty));
  const average = fixture(); average.teams[0].battingAverage = .400; assert.throws(() => validateBaseballSnapshot(average));
  const era = fixture(); era.teams[0].era = NaN; assert.throws(() => validateBaseballSnapshot(era));
  const tie = fixture(); tie.leaders.homeRuns.push({ id: "456", name: "Not tied", team: "Team 2", value: 44 }); assert.throws(() => validateBaseballSnapshot(tie));
});
test("MLB sync explicitly filters regular season and qualified batting while browser reads stored JSON", async () => {
  const sync = await readFile("scripts/refresh-mlb.mjs", "utf8"), page = await readFile("app/mlb/baseball-page.tsx", "utf8");
  assert.match(sync, /standingsTypes: "regularSeason"/); assert.match(sync, /gameType: "R"/); assert.match(sync, /leaderGameTypes: "R"/); assert.match(sync, /playerPool: "QUALIFIED"/);
  assert.match(page, /data\/mlb\/current\.json/); assert.doesNotMatch(page, /statsapi\.mlb\.com/);
});
