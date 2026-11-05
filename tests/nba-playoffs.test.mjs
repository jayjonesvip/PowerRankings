import { test } from "node:test";
import assert from "node:assert/strict";
import { basketballPlayoffPicture } from "../lib/nba-playoffs.ts";
const fixture=()=>["Eastern Conference","Western Conference"].flatMap((conference,c)=>Array.from({length:15},(_,i)=>({id:`${c}-${i+1}`,name:`Team ${c}-${i+1}`,conference,conferenceRank:i+1,wins:10-i%4,losses:i%4,winPercentage:(10-i%4)/10})));
test("NBA uses published conference order for six direct places, four play-in teams and five outside teams",()=>{
  const sides=basketballPlayoffPicture(fixture().reverse());
  for(const side of sides) {
    assert.deepEqual(side.direct.map(t=>t.conferenceRank),[1,2,3,4,5,6]);
    assert.deepEqual(side.playIn.map(t=>t.conferenceRank),[7,8,9,10]);
    assert.deepEqual(side.outside.map(t=>t.conferenceRank),[11,12,13,14,15]);
    assert.deepEqual(side.playInGames.map(g=>[g.home.conferenceRank,g.away.conferenceRank]),[[7,8],[9,10]]);
  }
});
test("NBA first round follows fixed bracket and leaves seeds seven and eight undecided",()=>{
  for(const side of basketballPlayoffPicture(fixture())) {
    assert.deepEqual(side.firstRound.map(g=>[g.home.seed,g.away.seed]),[[1,8],[4,5],[2,7],[3,6]]);
    assert.ok(side.firstRound.every(g=>g.home.team.conference===side.conference));
    assert.equal(side.firstRound[0].away.team,undefined);assert.equal(side.firstRound[2].away.team,undefined);
    assert.equal(side.firstRound[1].away.team.conferenceRank,5);assert.equal(side.firstRound[3].away.team.conferenceRank,6);
  }
});
test("NBA refuses incomplete, duplicate or invalid conference positions",()=>{
  for(const mutate of [t=>t.pop(),t=>t[1].conferenceRank=1,t=>t[0].conferenceRank=0,t=>t[0].conferenceRank=16,t=>t[0].conference="Unknown",t=>t[1].id=t[0].id]) {
    const teams=fixture();mutate(teams);assert.throws(()=>basketballPlayoffPicture(teams));
  }
});
