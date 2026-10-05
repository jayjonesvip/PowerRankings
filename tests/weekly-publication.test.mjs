import { test } from "node:test";
import assert from "node:assert/strict";
import { publicationSlot, shouldPublish } from "../scripts/weekly-publication.mjs";
import { validateWeeklyPost } from "../lib/weekly-rankings.ts";
const source={season:2026,ready:true,completedGames:63};
const previous={season:2026,ready:true,slot:"2026-09-29",completedGames:50};
test("Tuesday publication opens at 9 AM Eastern in daylight time",()=>{
 assert.equal(publicationSlot(new Date("2026-10-06T12:59:59Z")),"2026-09-29");
 assert.equal(publicationSlot(new Date("2026-10-06T13:00:00Z")),"2026-10-06");
 assert.equal(shouldPublish(previous,source,new Date("2026-10-06T12:59:59Z")),false);
 assert.equal(shouldPublish(previous,source,new Date("2026-10-06T13:00:00Z")),true);
});
test("winter and DST boundaries use Eastern time",()=>{
 assert.equal(publicationSlot(new Date("2026-11-03T13:59:59Z")),"2026-10-27");
 assert.equal(publicationSlot(new Date("2026-11-03T14:00:00Z")),"2026-11-03");
 assert.equal(publicationSlot(new Date("2026-03-10T12:59:59Z")),"2026-03-03");
 assert.equal(publicationSlot(new Date("2026-03-10T13:00:00Z")),"2026-03-10");
});
test("hourly data and push builds cannot rewrite an existing weekly edition",()=>{
 const published={...previous,slot:"2026-10-06"};
 for(const instant of ["2026-10-06T13:17:00Z","2026-10-08T15:00:00Z","2026-10-13T12:59:59Z"]) assert.equal(shouldPublish(published,{...source,completedGames:80},new Date(instant)),false);
 assert.equal(shouldPublish(published,{...source,completedGames:80},new Date("2026-10-13T13:00:00Z")),true);
 assert.equal(shouldPublish(previous,source,new Date("2026-10-07T13:00:00Z")),false);
 assert.equal(shouldPublish({...previous,season:2025,seasonComplete:true},{...source,season:2026},new Date("2026-10-05T23:00:00Z")),false);
});
test("final regular-season edition survives offseason and an unready new season",()=>{
 const final={...previous,seasonComplete:true,completedGames:272};
 assert.equal(shouldPublish(final,{...source,completedGames:272},new Date("2026-11-03T14:00:00Z")),false);
 assert.equal(shouldPublish(final,{season:2027,ready:false,completedGames:0},new Date("2027-09-07T13:00:00Z")),false);
 assert.equal(shouldPublish(final,{season:2027,ready:true,completedGames:16},new Date("2027-09-14T13:00:00Z")),true);
 assert.equal(shouldPublish(final,{season:2025,ready:true,completedGames:272},new Date("2026-11-03T14:00:00Z")),false);
});
test("new installs may seed a first edition, but unready leagues stay unpublished",()=>{
 assert.equal(shouldPublish(null,source,new Date("2026-10-05T23:00:00Z")),true);
 const waiting={schemaVersion:1,league:"nhl",season:20262027,seasonComplete:false,ready:false,slot:"2026-09-29",publishedAt:null,asOf:"2026-10-05T20:00:00Z",completedGames:39,headline:"Waiting",introduction:"Waiting for five games",methodology:"Method",teams:[]};
 assert.equal(validateWeeklyPost(waiting),waiting);
 assert.throws(()=>validateWeeklyPost({...waiting,publishedAt:waiting.asOf}));
 assert.equal(shouldPublish(waiting,{season:20262027,ready:true,completedGames:80},new Date("2026-10-05T23:00:00Z")),false);
});
