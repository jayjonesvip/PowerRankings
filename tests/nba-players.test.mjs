import { test } from "node:test";
import assert from "node:assert/strict";
import { parseNbaGame, aggregateNbaPlayers, nbaPlayerLeaders, nbaMvpCandidates, validateNbaPlayerStats } from "../lib/nba-player-stats.ts";
import { rankBasketballTeams } from "../lib/nba-model.ts";
const team=(id,extra={})=>({id,name:`Team ${id}`,abbreviation:id,conference:"Eastern Conference",conferenceRank:Number(id),wins:5,losses:5,gamesPlayed:10,winPercentage:.5,gamesBehind:0,pointsFor:1000,pointsAgainst:1000,streak:"W1",lastTen:"5-5",...extra});
const stint=(teamId,extra={})=>({teamId,gamesPlayed:10,points:250,assists:50,rebounds:70,steals:10,blocks:10,pointsInWins:120,...extra});
const player=(id,teamId,extra={})=>({id,name:`Player ${id}`,stints:[stint(teamId,extra)]});
const data=players=>({season:2027,seasonType:2,completedGames:10,players});
const sample=()=>({header:{id:"game",season:{year:2027,type:2},competitions:[{status:{type:{completed:true}},competitors:[{id:"1",score:"100"},{id:"2",score:"90"}]}]},boxscore:{players:[100,90].map((score,i)=>({team:{id:String(i+1)},statistics:[{names:["PTS","AST","REB","STL","BLK","FG","3PT","FT"],totals:[String(score),"5","8","2","1",`${(score-20)/2}-80`,"10-30","10-12"],athletes:[{athlete:{id:String(i+1),displayName:`Player ${i+1}`},stats:[String(score),"5","8","2","1"],didNotPlay:false},{athlete:{id:`dnp${i}`},stats:[],didNotPlay:true}]}]}))}});
test("NBA box-score parsing reads named columns and excludes DNP players",()=>{
  const game=parseNbaGame(sample(),"game",2027);assert.equal(game.teams[0].players.length,1);assert.equal(game.teams[1].players[0].points,90);assert.equal(game.teams[0].players[0].assists,5);
});
test("NBA player parsing rejects playoffs, incomplete scoring, duplicate players and missing categories",()=>{
  for(const mutate of [s=>s.header.season.type=3,s=>s.header.season.year=2026,s=>s.header.competitions[0].status.type.completed=false,s=>s.boxscore.players[0].statistics[0].athletes[0].stats[0]="99",s=>s.boxscore.players[0].statistics[0].names.pop(),s=>s.boxscore.players[0].statistics[0].athletes.push(s.boxscore.players[0].statistics[0].athletes[0])]) {
    const payload=sample();mutate(payload);assert.throws(()=>parseNbaGame(payload,"game",2027));
  }
});
test("NBA aggregation combines traded player stints and reconciles every team's wins and scoring",()=>{
  const first=parseNbaGame(sample(),"game",2027);
  const second=structuredClone(first);second.id="game2";second.teams[0].score=80;second.teams[0].scoring={freeThrowsMade:10,threePointersMade:0,twoPointersMade:35};second.teams[0].players[0]={...second.teams[0].players[0],id:"3",name:"Player 3",points:80};second.teams[1].score=100;second.teams[1].scoring={freeThrowsMade:10,threePointersMade:10,twoPointersMade:30};second.teams[1].players[0]={...second.teams[1].players[0],id:"1",name:"Player 1",points:100};
  const teams=[team("1",{gamesPlayed:2,wins:1,losses:1,pointsFor:180,pointsAgainst:190}),team("2",{gamesPlayed:2,wins:1,losses:1,pointsFor:190,pointsAgainst:180})];
  const result=aggregateNbaPlayers([first,second],teams,2027);
  assert.equal(result.players.find(p=>p.id==="1").stints.length,2);
  assert.equal(nbaPlayerLeaders(result,teams).points[0].value,100);
  assert.throws(()=>aggregateNbaPlayers([first,first],teams,2027));
  assert.throws(()=>aggregateNbaPlayers([first],teams,2027));
  const broken=structuredClone(result);broken.players[0].stints[0].points++;assert.throws(()=>validateNbaPlayerStats(broken,teams,2027,2));
  assert.throws(()=>validateNbaPlayerStats(result,teams,2028,2));
});
test("NBA per-game leaders use participation, combine categories, and retain stable exact ties",()=>{
  const teams=[team("1"),team("2")];
  const stats=data([player("B","1"),player("A","2"),player("tiny","1",{gamesPlayed:1,points:90,assists:50,rebounds:50,steals:20,blocks:20})]);
  const leaders=nbaPlayerLeaders(stats,teams);
  for(const rows of Object.values(leaders)) {assert.deepEqual(rows.map(p=>p.id),["A","B"]);assert.ok(rows.every(p=>p.id!=="tiny"));}
});
test("NBA MVP rewards stronger teams for identical production and accounts for availability",()=>{
  const teams=rankBasketballTeams([team("1",{wins:8,losses:2,winPercentage:.8,pointsFor:1100}),team("2",{wins:2,losses:8,winPercentage:.2,pointsAgainst:1100})]);
  const rows=nbaMvpCandidates(data([player("strong","1"),player("weak","2"),player("missed","1",{gamesPlayed:7,points:175,assists:35,rebounds:49,steals:7,blocks:7}),player("tiny","1",{gamesPlayed:4})]),teams);
  assert.equal(rows[0].id,"strong");assert.ok(rows.find(p=>p.id==="strong").score>rows.find(p=>p.id==="weak").score);assert.ok(rows[0].score>rows.find(p=>p.id==="missed").score);assert.ok(!rows.some(p=>p.id==="tiny"));
  assert.ok(rows.every(p=>p.score>=0&&p.score<=100));
});
test("NBA MVP all-around play can beat a higher scorer and every requested category contributes",()=>{
  const teams=rankBasketballTeams([team("1"),team("2")]);
  const rows=nbaMvpCandidates(data([player("scorer","1",{points:300,assists:10,rebounds:20,steals:2,blocks:1}),player("balanced","2",{points:280,assists:70,rebounds:100,steals:20,blocks:20})]),teams);
  assert.equal(rows[0].id,"balanced");
  for(const key of ["points","assists","rebounds","steals","blocks"]) {
    const better=player("better","1");better.stints[0][key]++;
    const comparison=nbaMvpCandidates(data([better,player("same","1")]),teams);assert.equal(comparison[0].id,"better");assert.ok(comparison[0].score>comparison[1].score);
  }
});
