import { test } from "node:test";
import assert from "node:assert/strict";
import { parseNbaScoring, basketballScoringBreakdown } from "../lib/nba-scoring.ts";

test("NBA scoring types partition points rather than made-shot counts",()=>{
  const scoring=parseNbaScoring(["FG","3PT","FT"],["40-80","10-30","15-20"],105);
  assert.deepEqual(scoring,{freeThrowsMade:15,threePointersMade:10,twoPointersMade:30});
  assert.deepEqual(basketballScoringBreakdown(scoring,105),{total:105,freeThrows:15,threePointers:30,twoPointers:60});
});
test("NBA shooting parsing follows column names and supports a zero-scoring breakdown",()=>{
  assert.deepEqual(parseNbaScoring(["FT","FG","3PT"],["0-0","3-8","3-5"],9),{freeThrowsMade:0,threePointersMade:3,twoPointersMade:0});
  assert.deepEqual(basketballScoringBreakdown({freeThrowsMade:0,threePointersMade:0,twoPointersMade:0},0),{total:0,freeThrows:0,threePointers:0,twoPointers:0});
});
test("NBA rejects missing, impossible and mismatched shooting totals",()=>{
  for(const totals of [["40-80","—","15-20"],["40-80","41-50","15-20"],["40-80","10-90","15-20"],["40-80","10-30","21-20"],["40-80","10-30","14-20"]]) assert.throws(()=>parseNbaScoring(["FG","3PT","FT"],totals,105));
  assert.throws(()=>parseNbaScoring(["FG","FT"],["40-80","15-20"],105));
  for(const scoring of [{freeThrowsMade:-1,threePointersMade:1,twoPointersMade:1},{freeThrowsMade:1,threePointersMade:.5,twoPointersMade:1},{freeThrowsMade:NaN,threePointersMade:1,twoPointersMade:1}]) assert.throws(()=>basketballScoringBreakdown(scoring));
  assert.throws(()=>basketballScoringBreakdown({freeThrowsMade:1,threePointersMade:1,twoPointersMade:1},100));
});
