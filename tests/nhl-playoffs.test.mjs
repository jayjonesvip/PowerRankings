import { test } from "node:test";
import assert from "node:assert/strict";
import { hockeyPlayoffPicture } from "../lib/nhl-playoffs.ts";
const fixture=()=>["Eastern","Western"].flatMap((conference,c)=>[0,1].flatMap(d=>Array.from({length:8},(_,i)=>({id:`${c}-${d}-${i}`,conference,division:`Division ${d}`,divisionRank:i+1,conferenceRank:d*8+i+1,wildCardRank:i<3 ? 0 : d*5+i-2}))));
test("NHL allocates six division qualifiers and two conference wild cards with correct pairings",()=>{
 const sides=hockeyPlayoffPicture(fixture());
 assert.equal(sides.length,2);
 for(const side of sides) {
  assert.equal(new Set(side.matchups.flatMap(m=>[m.home.id,m.away.id])).size,8);
  assert.equal(side.matchups[0].away.wildCardRank,2);
  assert.equal(side.matchups[2].away.wildCardRank,1);
  assert.deepEqual(side.matchups[1].home.divisionRank,2);
  assert.deepEqual(side.matchups[1].away.divisionRank,3);
 }
});
test("NHL published conference ordering controls division-winner wild-card pairing",()=>{
 const teams=fixture();
 [teams[0].conferenceRank,teams[8].conferenceRank]=[teams[8].conferenceRank,teams[0].conferenceRank];
 const side=hockeyPlayoffPicture(teams)[0];
 assert.equal(side.matchups[0].home.id,"0-1-0");
 assert.equal(side.matchups[0].away.wildCardRank,2);
});
test("missing NHL ranks cannot silently invent playoff seeds",()=>{
 const teams=fixture();delete teams[0].divisionRank;
 assert.throws(()=>hockeyPlayoffPicture(teams));
});
