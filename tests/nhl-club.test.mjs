import test from "node:test";
import assert from "node:assert/strict";
import { validateHockeyClubStats } from "../lib/nhl-model.ts";
const fixture = () => ({abbreviation:"BOS",gamesPlayed:3,players:[{id:"1",name:"Skater",gamesPlayed:3,goals:2,assists:3,points:5,shots:10}],goalies:[{id:"2",name:"Goalie",gamesPlayed:3,saves:70,shotsAgainst:85,goalsAgainst:16,shutouts:0,timeOnIce:8855}]});
test("club totals validate points and accept independently published goalie counters",()=>assert.doesNotThrow(()=>validateHockeyClubStats(fixture())));
test("missing, duplicate, malformed and excessive club stats fail before publication",()=>{
 for (const mutate of [t=>t.players[0].points=6,t=>t.players.push({...t.players[0]}),t=>t.goalies[0].timeOnIce=undefined,t=>t.players[0].gamesPlayed=4,t=>t.goalies=[]]) {
  const team=fixture();mutate(team);assert.throws(()=>validateHockeyClubStats(team));
 }
});
