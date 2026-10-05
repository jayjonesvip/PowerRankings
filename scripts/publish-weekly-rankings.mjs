import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { buildSnapshots, fetchSeasonGames } from "../lib/rankings.ts";
import { assessMatchup } from "../lib/matchup.ts";
import { validateBaseballSnapshot } from "../lib/mlb-model.ts";
import { rankBaseballTeams } from "../lib/weekly-baseball-rankings.ts";
import { validateWeeklyPost } from "../lib/weekly-rankings.ts";
import { publicationSlot, shouldPublish } from "./weekly-publication.mjs";
const now = new Date();
const read = async path => JSON.parse(await readFile(path,"utf8"));
const root="content/power-rankings";
await mkdir(root,{recursive:true});
const nfl=await read("public/data/nfl/current.json");
const games=await fetchSeasonGames(nfl.season,path=>read(`public/data/nfl/${path}`));
const nflSnapshot=buildSnapshots(games).at(-1);
const manifest=await read(`public/data/nfl/${nfl.season}/manifest.json`);
const nhl=await read("public/data/nhl/current.json");
const mlb=validateBaseballSnapshot(await read("public/data/mlb/current.json"));
const fmt=(v,n=1)=>Number(v).toFixed(n);
const signed=v=>`${v>=0?"+":""}${fmt(v)}`;
const baseballTeams=rankBaseballTeams(mlb.teams);
const sources={
 nfl:{season:nfl.season,seasonComplete:nfl.seasonComplete,ready:nflSnapshot?.teams.length===32,asOf:manifest.updatedAt,completedGames:nflSnapshot?.completedGames??0,week:nflSnapshot?.week,teams:nflSnapshot?.teams??[],methodology:"Jay’s NFL Index: record 25%, win quality 30%, offense 20%, defense 20%, recent form 5%. Win quality combines opponent performance (80%) and scoring margin (20%). This is a statistical ordering, not an official standing or a prediction."},
 nhl:{season:nhl.season,seasonComplete:Boolean(nhl.seasonComplete),ready:nhl.rankingsReady,asOf:nhl.updatedAt,completedGames:nhl.completedGames,teams:nhl.rankings,methodology:"Jay’s NHL Index: standings points percentage 25%, win quality 30%, offense 20%, defense 20%, last five games 5%. Win quality combines opponent points percentage (80%) and goal margin (20%). Every team needs five regular-season games before rankings are published."},
 mlb:{season:mlb.season,seasonComplete:mlb.seasonComplete,ready:mlb.teams.every(t=>t.gamesPlayed>=5),asOf:mlb.updatedAt,completedGames:mlb.completedGames,teams:baseballTeams,methodology:"Jay’s MLB Index: win percentage 40%, run differential per game 30%, team batting average 15%, ERA 15%. Win percentage is scored from 0–100; other signals use bounded curves against neutral run differential or the league’s team-average rate. This model does not adjust for opponent strength or park effects. Every team needs five regular-season games."}
};
const upcoming=[];
for(let week=1;week<=18;week++) {
 const payload=await read(`public/data/nfl/${nfl.season}/week-${week}.json`);
 for(const event of payload.events) {
  if(event.status.type.completed || Date.parse(event.date)<now.getTime()) continue;
  const c=event.competitions[0],h=c.competitors.find(t=>t.homeAway==="home"),a=c.competitors.find(t=>t.homeAway==="away");
  upcoming.push({date:event.date,week,homeId:String(h.team.id),awayId:String(a.team.id),homeName:h.team.displayName,awayName:a.team.displayName,neutralSite:Boolean(c.neutralSite)});
 }
}
upcoming.sort((a,b)=>a.date.localeCompare(b.date));
for(const [league,source] of Object.entries(sources)) {
 let previous;try{previous=validateWeeklyPost(await read(`${root}/${league}.json`));}catch(error){if(error.code!=="ENOENT")throw error;}
 if(!shouldPublish(previous,source,now)){console.log(`Retaining ${league.toUpperCase()} weekly edition (${previous.slot})`);continue;}
 const previousRanks=new Map(previous?.ready&&previous.season===source.season?previous.teams.map(t=>[t.id,t.rank]):[]);
 const teams=source.ready?source.teams.map(t=>{
  const movement=previousRanks.has(t.id)?previousRanks.get(t.id)-t.rank:null;
  const gp=league==="nfl"?t.wins+t.losses+t.ties:t.gamesPlayed;
  const record=league==="nfl"?`${t.wins}–${t.losses}${t.ties?`–${t.ties}`:""}`:league==="nhl"?`${t.wins}–${t.losses}–${t.overtimeLosses}`:`${t.wins}–${t.losses}`;
  let story,stats,recent,next;
  if(league==="nfl") {
   const margin=(t.pointsFor-t.pointsAgainst)/gp;
   const strengths={record:"The record is doing plenty of the heavy lifting",quality:"Wins against stronger opponents carry real weight here",offense:"Scoring is their strongest part of the index",defense:"Keeping opponents off the scoreboard is their strongest part of the index",momentum:"Recent form is their strongest part of the index"};
   const best=Object.entries(t.components).sort((a,b)=>b[1]-a[1])[0][0];
   const latest=t.recentGames[0];
   const opponent=latest?source.teams.find(other=>other.abbreviation===latest.opponent)?.name??latest.opponent:null;
   const lastResult=latest?`Last time out, they ${latest.result==="W"?"beat":latest.result==="L"?"lost to":"tied"} ${opponent} ${latest.pointsFor}–${latest.pointsAgainst}. `:"";
   story=`${lastResult}${strengths[best]}. At ${record}, they’re ${margin>=0?"outscoring opponents":"being outscored"} by ${fmt(Math.abs(margin))} points a game, while allowing ${fmt(t.pointsAgainst/gp)}.`;
   stats=[{label:"Jay’s Index",value:fmt(t.score)},{label:"Record",value:record},{label:"Points scored / allowed",value:`${t.pointsFor} / ${t.pointsAgainst}`},{label:"Points scored per game",value:fmt(t.pointsFor/gp)},{label:"Points allowed per game",value:fmt(t.pointsAgainst/gp)},...Object.entries(t.components).map(([k,v])=>({label:{record:"Record grade",quality:"Win quality grade",offense:"Offense grade",defense:"Defense grade",momentum:"Recent form grade"}[k],value:fmt(v)}))];
   recent=t.recentGames.map(g=>`${g.result} ${g.opponent} ${g.pointsFor}–${g.pointsAgainst}`);
   const game=upcoming.find(g=>g.homeId===t.id||g.awayId===t.id);
   const assessment=game?assessMatchup(game,t,source.teams):null;
   if(assessment) next={opponent:`${game.neutralSite||game.homeId===t.id?"vs.":"at"} ${game.homeId===t.id?game.awayName:game.homeName}`,label:assessment.label,reason:assessment.reason};
  } else if(league==="nhl") {
   story=`${t.name} take No. ${t.rank} with a ${record} record and ${t.points} standings points. They’re scoring ${fmt(t.goalsForAverage,2)} goals per game and allowing ${fmt(t.goalsAgainstAverage,2)}. ${t.goalsForAverage>t.goalsAgainstAverage?"That positive scoring balance helps their case.":"Closing that scoring gap is the clearest place to improve."}`;
   stats=[{label:"Jay’s Index",value:fmt(t.score)},{label:"Record (W–L–OTL)",value:record},{label:"Standings points",value:String(t.points)},{label:"Goals scored / allowed",value:`${t.goalsFor} / ${t.goalsAgainst}`},{label:"Goals scored per game",value:fmt(t.goalsForAverage,2)},{label:"Goals allowed per game",value:fmt(t.goalsAgainstAverage,2)},...Object.entries(t.components).map(([k,v])=>({label:{record:"Record grade",quality:"Win quality grade",offense:"Offense grade",defense:"Defense grade",momentum:"Recent form grade"}[k],value:fmt(v)}))];recent=t.recent;
  } else {
   const diff=t.runsFor-t.runsAgainst;
   story=`${t.name} check in at No. ${t.rank} with a ${record} record. The run differential is ${diff>=0?"+":""}${diff}, with a ${fmt(t.battingAverage,3).replace(/^0/,"")} team batting average and ${fmt(t.era,2)} ERA. ${diff>0?"They’ve backed up the record by scoring more than they allow.":"The scoring balance leaves room for improvement."}`;
   stats=[{label:"Jay’s Index",value:fmt(t.score)},{label:"Record",value:record},{label:"Win percentage",value:fmt(t.wins/gp,3)},{label:"Run differential per game",value:signed(diff/gp)},{label:"Runs scored / allowed",value:`${t.runsFor} / ${t.runsAgainst}`},{label:"Batting average",value:fmt(t.battingAverage,3).replace(/^0/,"")},{label:"ERA",value:fmt(t.era,2)},{label:"Home runs",value:String(t.homeRuns)}];
  }
  return {id:t.id,name:t.name,abbreviation:t.abbreviation,rank:t.rank,score:t.score,record,movement,story,stats,...(recent?{recent}:{}),...(next?{next}:{})};
 }):[];
 const introduction=source.ready?`The No. 1 spot belongs to ${teams[0].name} on this ${source.seasonComplete?"final regular-season":"week’s"} board. Here’s how all ${teams.length} teams stack up, based on ${source.completedGames.toLocaleString("en-US")} completed regular-season games. Read the quick take for each team, then open the numbers if you want to dig deeper.`:`We’re waiting for every team to reach five regular-season games. Once the sample is ready, the first Tuesday edition will appear here. Preseason and playoff results won’t enter these rankings.`;
 const post=validateWeeklyPost({schemaVersion:1,league,season:source.season,seasonComplete:source.seasonComplete,ready:source.ready,slot:publicationSlot(now),publishedAt:source.ready?now.toISOString():null,asOf:source.asOf,completedGames:source.completedGames,...(source.week?{week:source.week}:{}),headline:source.ready?`At No. 1: ${teams[0].name}` : "Building the regular-season sample",introduction,methodology:source.methodology,teams});
 await writeFile(`${root}/${league}.json.tmp`,JSON.stringify(post,null,2)+"\n");await rename(`${root}/${league}.json.tmp`,`${root}/${league}.json`);
 console.log(`${source.ready?"Published":"Prepared"} ${league.toUpperCase()} edition (${post.slot})`);
}
