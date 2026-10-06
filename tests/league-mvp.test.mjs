import test from "node:test";
import assert from "node:assert/strict";
import { baseballMvps,hockeyMvps } from "../scripts/league-mvp-model.mjs";
const hitter=(id,ops,homeRuns,rbi)=>({id,name:id,team:"Club",teamGames:162,gamesPlayed:150,plateAppearances:600,ops,homeRuns,rbi});
const pitcher=(id,era,whip,outs,strikeOuts)=>({id,name:id,team:"Club",teamGames:162,gamesPlayed:32,era,whip,outs,strikeOuts});
test("MLB weighs balanced hitting over home runs alone and prevents tiny samples",()=>{
 const result=baseballMvps([hitter("balanced",1.1,40,120),hitter("hr",.8,50,90),{...hitter("tiny",2,60,150),plateAppearances:5}],[]);
 assert.equal(result.first[0].id,"balanced");assert.deepEqual(result.second,[]);assert.match(result.first[0].reason,/qualified-hitter average/);
});
test("pitcher selection combines workload and prevention and formats outs as baseball innings",()=>{
 const result=baseballMvps([],[pitcher("ace",2,1,601,220),pitcher("other",4,1.4,540,180),pitcher("reliever",0,.5,150,100)]);
 assert.equal(result.second[0].id,"ace");assert.equal(result.second[0].stats.find(s=>s.label==="Innings").value,"200.1");
});
test("exactly tied statistical picks are retained without alphabetical award selection",()=>{
 assert.equal(baseballMvps([hitter("a",1,40,100),hitter("b",1,40,100)],[]).first.length,2);
});
const team=(name,player,goalie)=>({name,gamesPlayed:4,players:[{id:name,name,position:"C",gamesPlayed:4,points:player,goals:player/2,assists:player/2,shots:20}],goalies:[{id:goalie.id,name:goalie.id,gamesPlayed:3,shutouts:0,...goalie}]});
test("NHL goalie baseline weights shots, early picks are flagged, and one-game spikes do not qualify",()=>{
 const teams=[team("A",8,{id:"good",saves:95,shotsAgainst:100,goalsAgainst:5,timeOnIce:10800}),team("B",4,{id:"other",saves:80,shotsAgainst:100,goalsAgainst:20,timeOnIce:10800})];
 teams[0].players.push({id:"tiny",name:"tiny",gamesPlayed:1,points:10,goals:10,assists:0,shots:10});
 const result=hockeyMvps(teams);assert.equal(result.first[0].name,"A");assert.equal(result.second[0].name,"good");assert.equal(result.first[0].limited,true);assert.equal(result.second[0].stats.find(s=>s.label==="Goals saved vs average").value,"+7.5");
});
test("traded NHL players are combined once",()=>{
 const teams=[team("A",8,{id:"g1",saves:95,shotsAgainst:100,goalsAgainst:5,timeOnIce:10800}),team("B",4,{id:"g2",saves:80,shotsAgainst:100,goalsAgainst:20,timeOnIce:10800})];
 teams[1].players.push({...teams[0].players[0],gamesPlayed:2,points:2,goals:1,assists:1});
 const result=hockeyMvps(teams);assert.equal(result.first[0].team,"Multiple teams");assert.equal(result.first[0].stats[0].value,"10");
});
test("NHL goalie runners-up keep MVP order, exclude tied winners and tiny samples, and cap at four",()=>{
 const teams=Array.from({length:7},(_,i)=>team(String(i),8,{id:`g${i}`,saves:95-i*3,shotsAgainst:100,goalsAgainst:5+i*3,timeOnIce:10800}));
 teams.push(team("tied",8,{id:"tied",saves:95,shotsAgainst:100,goalsAgainst:5,timeOnIce:10800}));
 teams.push(team("tiny",8,{id:"tiny",saves:100,shotsAgainst:100,goalsAgainst:0,timeOnIce:100}));
 const result=hockeyMvps(teams);
 assert.deepEqual(result.second.map(p=>p.id),["g0","tied"]);
 assert.deepEqual(result.secondRunnersUp.map(p=>p.id),["g1","g2","g3","g4"]);
});
test("NHL skater runners-up exclude tied MVPs and ineligible samples and retain score order",()=>{
 const teams=Array.from({length:7},(_,i)=>team(String(i),14-i*2,{id:`g${i}`,saves:90,shotsAgainst:100,goalsAgainst:10,timeOnIce:10800}));
 teams.push(team("tied",14,{id:"tie-goalie",saves:90,shotsAgainst:100,goalsAgainst:10,timeOnIce:10800}));
 teams[0].players.push({id:"tiny",name:"tiny",gamesPlayed:1,points:100,goals:100,assists:0,shots:100});
 const result=hockeyMvps(teams);
 assert.deepEqual(result.first.map(p=>p.id),["0","tied"]);
 assert.deepEqual(result.firstRunnersUp.map(p=>p.id),["1","2","3","4"]);
});
