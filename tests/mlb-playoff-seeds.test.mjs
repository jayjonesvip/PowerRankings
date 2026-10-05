import { test } from "node:test";
import assert from "node:assert/strict";
import { mlbPlayoffSeeds } from "../scripts/mlb-playoff-seeds.mjs";
const fixture = () => ({records:["American League","National League"].flatMap((league,l)=>[0,1,2].map(division=>({teamRecords:Array.from({length:5},(_,i)=>({team:{id:l*100+division*5+i+1,league:{name:league},division:{id:division}},divisionRank:String(i+1),leagueRank:String(division===2&&i===0 ? 8 : division*5+i+1),wildCardRank:i===0 ? undefined : String(i===1 ? division+1 : 4+division*3+i-2),wins:90,losses:72}))}))) });
test("MLB division winners remain seeds 1–3 even below wild cards in overall rank",()=>{
 const seeds=mlbPlayoffSeeds(fixture());
 assert.equal(seeds.length,12);
 assert.deepEqual(seeds.slice(0,6).map(t=>[t.seed,t.divisionWinner]),[[1,true],[2,true],[3,true],[4,false],[5,false],[6,false]]);
 assert.equal(seeds[2].id,"11");
});
test("MLB uses published wild-card ranks for tied records rather than team order",()=>{
 const data=fixture();
 data.records[0].teamRecords[1].wildCardRank="3";
 data.records[2].teamRecords[1].wildCardRank="1";
 assert.deepEqual(mlbPlayoffSeeds(data).slice(3,6).map(t=>t.id),["12","7","2"]);
});
test("incomplete or duplicate wildcard positions cannot publish opening seeds",()=>{
 const data=fixture(); data.records[0].teamRecords[1].wildCardRank="2";
 assert.throws(()=>mlbPlayoffSeeds(data));
});
