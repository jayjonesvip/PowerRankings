import { test } from "node:test";
import assert from "node:assert/strict";
import { assessMatchup } from "../lib/matchup.ts";
import { buildDivisionStandings } from "../lib/playoffs.ts";
const home = { id: "home", abbreviation: "BUF", name: "Buffalo Bills", rank: 1, score: 85, wins: 5, losses: 0, ties: 0, pointsFor: 150, pointsAgainst: 75 };
const away = { id: "away", abbreviation: "MIA", name: "Miami Dolphins", rank: 30, score: 25, wins: 0, losses: 5, ties: 0, pointsFor: 75, pointsAgainst: 150 };
const game = { homeId: "home", awayId: "away", neutralSite: false };
test("next-opponent assessments give both teams opposite matchup perspectives", () => {
  const favored = assessMatchup(game, home, [home, away]);
  const underdog = assessMatchup(game, away, [home, away]);
  assert.equal(favored.label, "Favorable matchup");
  assert.equal(underdog.label, "Very tough matchup");
  assert.equal(favored.opponent.id, away.id);
  assert.equal(favored.margin, -underdog.margin);
  assert.match(favored.reason, /At home/);
  assert.match(underdog.reason, /On the road/);
});
test("close and neutral matchups do not invent a strong favorite", () => {
  const matched = { ...away, pointsFor: 150, pointsAgainst: 75, score: 85, wins: 5, losses: 0 };
  const assessment = assessMatchup({ ...game, neutralSite: true }, home, [home, matched]);
  assert.equal(assessment.label, "Close matchup");
  assert.match(assessment.reason, /Neutral site/);
  assert.equal(assessMatchup(game, home, [home]), null);
});
test("NFL divisions contain all 32 teams before kickoff and use record rather than power index", () => {
  const blank = buildDivisionStandings([], [], 1);
  assert.deepEqual(blank.map(c => c.conference), ["AFC", "NFC"]);
  assert.equal(blank.flatMap(c => c.divisions).length, 8);
  assert.ok(blank.flatMap(c => c.divisions).every(d => d.teams.length === 4));
  const rows = blank.flatMap(c => c.divisions.flatMap(d => d.teams));
  assert.equal(new Set(rows.map(t => t.abbreviation)).size, 32);
  const ranked = buildDivisionStandings([], [{ ...rows.find(t => t.abbreviation === "BUF"), wins: 2, score: 10 }, { ...rows.find(t => t.abbreviation === "MIA"), wins: 1, losses: 1, score: 99 }], 2);
  assert.equal(ranked[0].divisions[0].teams[0].abbreviation, "BUF");
});
