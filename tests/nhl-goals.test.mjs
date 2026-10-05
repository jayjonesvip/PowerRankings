import { test } from "node:test";
import assert from "node:assert/strict";
import { hockeyGoalBreakdown } from "../lib/nhl-goals.ts";
test("NHL goal slices partition credited goals without double counting or shootout bonuses",()=>{
 const teams=[{goalsFor:11,players:[{goals:6,powerPlayGoals:2,shorthandedGoals:1},{goals:4,powerPlayGoals:1,shorthandedGoals:0}]}];
 assert.deepEqual(hockeyGoalBreakdown(teams),{total:10,powerPlay:3,shorthanded:1,other:6});
});
test("missing or impossible goal situation counters do not silently become zero",()=>{
 assert.throws(()=>hockeyGoalBreakdown([{players:[{goals:3,powerPlayGoals:2}]}]));
 assert.throws(()=>hockeyGoalBreakdown([{players:[{goals:3,powerPlayGoals:2,shorthandedGoals:2}]}]));
});
test("zero-goal sample has zero segments",()=>{
 assert.deepEqual(hockeyGoalBreakdown([{players:[]}]),{total:0,powerPlay:0,shorthanded:0,other:0});
});
