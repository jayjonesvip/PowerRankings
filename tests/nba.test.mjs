import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBasketballStandings, validateBasketballSnapshot, rankBasketballTeams } from "../lib/nba-model.ts";
const makeFeed=(games=6)=>({season:{year:2027},children:["Eastern Conference","Western Conference"].map((name,c)=>({name,standings:{season:2027,seasonType:2,entries:Array.from({length:15},(_,i)=>({team:{id:String(c*15+i+1),displayName:`Team ${c*15+i+1}`,abbreviation:`T${c*15+i+1}`},stats:Object.entries({wins:games/2,losses:games/2,playoffSeed:i+1,winPercent:games?0.5:0,gamesBehind:0,pointsFor:games*110,pointsAgainst:games*110}).map(([name,value])=>({name,value}))}))}}))});
const parse=feed=>parseBasketballStandings(feed,2027,"2026-11-05T14:00:00Z");
test("NBA feed yields all teams, conference positions, scoring and five-game readiness",()=>{
  const data=parse(makeFeed());assert.equal(data.completedGames,90);assert.equal(data.rankingsReady,true);assert.equal(data.teams[0].pointsFor/data.teams[0].gamesPlayed,110);
  const empty=parse(makeFeed(0));assert.equal(empty.rankingsReady,false);assert.equal(empty.completedGames,0);
  const small=parse(makeFeed(4));assert.equal(small.rankingsReady,false);
});
test("NBA rejects wrong seasons, playoffs, missing stats and truncated/duplicate teams",()=>{
  for(const mutate of [f=>f.season.year=2026,f=>f.children[0].standings.seasonType=3,f=>f.children.pop(),f=>f.children[0].standings.entries.pop(),f=>f.children[0].standings.entries[1]=f.children[0].standings.entries[0],f=>f.children[0].standings.entries[0].stats.pop()]) {
    const feed=makeFeed();mutate(feed);assert.throws(()=>parse(feed));
  }
});
test("NBA rejects mismatched league totals, bad percentages and conference positions",()=>{
  for(const mutate of [d=>d.teams[0].pointsFor++,d=>d.teams[0].wins++,d=>d.teams[0].winPercentage=2,d=>d.teams[0].conferenceRank=16,d=>d.completedGames++,d=>d.rankingsReady=false]) {
    const data=parse(makeFeed());mutate(data);assert.throws(()=>validateBasketballSnapshot(data));
  }
});
test("NBA index rewards record and per-game margin with deterministic bounded scores",()=>{
  const teams=parse(makeFeed()).teams;
  teams[1]={...teams[1],winPercentage:0.75};teams[2]={...teams[2],pointsFor:720};
  const rankings=rankBasketballTeams(teams);
  const baseline=rankings.find(t=>t.id===teams[0].id).score;
  assert.ok(rankings.find(t=>t.id===teams[1].id).score>baseline);
  assert.ok(rankings.find(t=>t.id===teams[2].id).score>baseline);
  assert.ok(rankings.every((t,i)=>t.rank===i+1&&t.score>=0&&t.score<=100));
});
