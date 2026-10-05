import test from "node:test";
import assert from "node:assert/strict";
import {shouldRetainSeason,latestPlayedSeason} from "../scripts/season-lifecycle.mjs";
import {validateWeek} from "../scripts/refresh-nfl.mjs";
test("new empty season retains the completed regular-season snapshot",()=>{
 for(const [old,next,count] of [[2026,2027,2429],[20262027,20272028,1344]]) assert.equal(shouldRetainSeason({season:old,completedGames:count},next,0),true);
});
test("first new regular-season final switches seasons; stale seasons never replace newer samples",()=>{
 assert.equal(shouldRetainSeason({season:2026,completedGames:272},2027,1),false);
 assert.equal(shouldRetainSeason({season:2027,completedGames:1},2026,272),true);
});
test("NFL selection follows played samples rather than calendar or preseason schedules",()=>{
 assert.equal(latestPlayedSeason([{season:2026,completed:272},{season:2027,completed:0}]).season,2026);
 assert.equal(latestPlayedSeason([{season:2026,completed:272},{season:2027,completed:1}]).season,2027);
 assert.throws(()=>latestPlayedSeason([{season:2027,completed:0}]));
});
test("NFL preseason and postseason scoreboards cannot enter published data",()=>{
 for(const type of [1,3]) assert.throws(()=>validateWeek({season:{type},events:[]}));
 assert.doesNotThrow(()=>validateWeek({season:{type:2},events:[]}));
});

test("completed regular-season snapshots stay frozen until a new played sample",()=>{
 assert.equal(shouldRetainSeason({season:2026,completedGames:2429,seasonComplete:true},2026,2429),true);
 assert.equal(shouldRetainSeason({season:2026,completedGames:2429,seasonComplete:true},2027,1),false);
});
