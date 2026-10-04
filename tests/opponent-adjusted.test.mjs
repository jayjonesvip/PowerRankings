import { test } from "node:test";
import assert from "node:assert/strict";
import { opponentAdjustedPerformance, hockeyScoredGames } from "../lib/opponent-adjusted.ts";
const game = (id, homeId, awayId, homeScore, awayScore) => ({ id, homeId, awayId, homeScore, awayScore });

test("opponent baselines exclude the evaluated game and both signs reward better performance", () => {
  const games = [game("ab", "A", "B", 40, 10), game("bc", "B", "C", 20, 30), game("bd", "B", "D", 30, 20)];
  const a = opponentAdjustedPerformance(games).get("A");
  assert.deepEqual(a, { offense: 15, defense: 15, qualifyingGames: 1, totalGames: 1 });
  const worse = opponentAdjustedPerformance([{ ...games[0], homeScore: 10, awayScore: 40 }, ...games.slice(1)]).get("A");
  assert.equal(worse.offense, -15); assert.equal(worse.defense, -15);
});
test("missing opponent samples are unavailable rather than zero and future NHL games are excluded", () => {
  const a = opponentAdjustedPerformance([game("ab", "A", "B", 20, 10), game("bc", "B", "C", 30, 20)]).get("A");
  assert.deepEqual(a, { offense: null, defense: null, qualifyingGames: 0, totalGames: 1 });
  assert.deepEqual(hockeyScoredGames([{ ...game("future", "A", "B", null, null), completed: false, decision: null }]), []);
});
test("each qualifying game has equal weight even when opponent sample sizes differ", () => {
  const games = [game("ab", "A", "B", 40, 10), game("ac", "A", "C", 10, 40),
    game("bd", "B", "D", 20, 30), game("be", "B", "E", 30, 20),
    game("cd", "C", "D", 20, 20), game("ce", "C", "E", 20, 20), game("cf", "C", "F", 20, 20)];
  const a = opponentAdjustedPerformance(games).get("A");
  assert.equal(a.qualifyingGames, 2); assert.equal(a.totalGames, 2);
  assert.equal(a.offense, 2.5); assert.equal(a.defense, -2.5);
});
test("NHL shootout awards are removed from either winner while overtime goals remain", () => {
  const result = hockeyScoredGames([
    { ...game("home", "A", "B", 3, 2), completed: true, decision: "SO" },
    { ...game("away", "A", "B", 1, 2), completed: true, decision: "SO" },
    { ...game("ot", "A", "B", 3, 2), completed: true, decision: "OT" },
  ]);
  assert.deepEqual(result.map(g => [g.homeScore, g.awayScore]), [[2, 2], [1, 1], [3, 2]]);
});
