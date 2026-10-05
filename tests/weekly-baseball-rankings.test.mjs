import { test } from "node:test";
import assert from "node:assert/strict";
import { rankBaseballTeams } from "../lib/weekly-baseball-rankings.ts";
const team=(id,extra={})=>({id,name:id,abbreviation:id,gamesPlayed:100,wins:50,runsFor:400,runsAgainst:400,battingAverage:.250,era:4,...extra});
test("MLB weekly index rewards wins, scoring balance, hitting and run prevention",()=>{
 for(const change of [{wins:65},{runsFor:550},{battingAverage:.290},{era:2.8}]) {
  const ranked=rankBaseballTeams([team("neutral"),team("improved",change)]);
  assert.equal(ranked[0].id,"improved");assert.ok(ranked[0].score>ranked[1].score);
 }
});
test("MLB weekly index uses per-game rates and a stable tie order",()=>{
 const ranked=rankBaseballTeams([team("B"),team("A",{gamesPlayed:50,wins:25,runsFor:200,runsAgainst:200})]);
 assert.equal(ranked[0].id,"A");assert.equal(ranked[0].score,ranked[1].score);
 assert.deepEqual(ranked.map(t=>t.rank),[1,2]);
 assert.ok(ranked.every(t=>t.score>=0&&t.score<=100));assert.deepEqual(rankBaseballTeams([]),[]);
});
