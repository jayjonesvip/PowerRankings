import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMvpSnapshot } from "../scripts/nfl-mvp-model.mjs";
const row = (id, stats) => ({ athlete: { id, displayName: id }, stats: stats.map(String) });
const team = (id, multiplier = 1) => ({ team: { id, displayName: id, abbreviation: id }, statistics: [
  { name: "receiving", keys: ["receivingYards", "receivingTouchdowns", "receptions", "receivingTargets"], athletes: [row(`${id}-WR`, [50 * multiplier, multiplier, 4, 6])] },
  { name: "defensive", keys: ["totalTackles", "sacks", "passesDefended", "tacklesForLoss", "defensiveTouchdowns"], athletes: [row(`${id}-DE`, [4, multiplier, 1, 2, 1])] },
  { name: "interceptions", keys: ["interceptions", "interceptionTouchdowns"], athletes: [row(`${id}-DE`, [1, 1])] },
] });
const roster = id => ({ athletes: [{ items: ["WR", "DE"].map(position => ({ id: `${id}-${position}`, position: { abbreviation: position } })) }] });
const fixture = () => ({ season: 2026, updatedAt: "2026-10-04T12:00:00Z", rosters: [roster("A"), roster("B")], games: [1, 2].map(id => ({ id: String(id), players: [team("A", 2), team("B")] })) });
test("MVPs select offense and defense separately and explain position-relative production", () => {
  const result = buildMvpSnapshot(fixture());
  assert.equal(result.offense.name, "A-WR");
  assert.equal(result.defense.name, "A-DE");
  assert.equal(result.offense.receivingYards, 200);
  assert.match(result.offense.reason, /100 receiving yards per game, compared with 75/);
  assert.match(result.defense.reason, /strongest position-relative defensive score/);
});
test("interception touchdowns are credited once across duplicate box-score categories", () => {
  const result = buildMvpSnapshot(fixture());
  assert.equal(result.defense.defensiveTouchdowns, 2);
  assert.equal(result.defense.production, 16);
});
test("one-game performances cannot become league MVPs and duplicate games fail", () => {
  const input = fixture();
  assert.equal(buildMvpSnapshot({ ...input, games: input.games.slice(0, 1) }).offense, null);
  assert.throws(() => buildMvpSnapshot({ ...input, games: [input.games[0], input.games[0]] }), /Duplicate/);
});
test("extra games do not inflate MVP production rates", () => {
  const input = fixture();
  const before = buildMvpSnapshot(input);
  const after = buildMvpSnapshot({ ...input, games: [...input.games, { ...input.games[0], id: "3" }] });
  assert.equal(after.offense.production, before.offense.production);
  assert.equal(after.offense.index, before.offense.index);
  assert.equal(after.defense.index, before.defense.index);
});
test("missing required stats fail instead of silently becoming zero", () => {
  const input = fixture();
  input.games[0].players[0].statistics[0].athletes[0].stats = [];
  assert.throws(() => buildMvpSnapshot(input), /Missing MVP statistic/);
});
test("NFL MVP runners-up retain position-relative ordering, exclude the winner and cap at four",()=>{
 const input=fixture();input.rosters=Array.from({length:8},(_,i)=>roster(String(i)));
 input.games=Array.from({length:8},(_,i)=>({id:String(i),players:[team(String(i),i+1),team(String((i+1)%8),(i+1)%8+1)]}));
 const result=buildMvpSnapshot(input);
 for(const side of ["offense","defense"]){
  const rows=result[side+"RunnersUp"];
  assert.equal(rows.length,4);assert.ok(rows.every(p=>p.id!==result[side].id));
  assert.ok(rows.every((p,i)=>i===0?p.index<=result[side].index:p.index<=rows[i-1].index));
 }
 const tiny=buildMvpSnapshot({...fixture(),games:fixture().games.slice(0,1)});
 assert.deepEqual(tiny.offenseRunnersUp,[]);assert.deepEqual(tiny.defenseRunnersUp,[]);
});
