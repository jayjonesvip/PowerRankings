const mean = values => values.reduce((a,b)=>a+b,0)/values.length;
function rank(rows, metrics, leadersOnly = true) {
  if (rows.length < 2) return [];
  const baselines = metrics.map(([key,weight]) => {
    const values=rows.map(r=>r[key]); const average=mean(values);
    return {key,weight,average,sd:Math.sqrt(mean(values.map(v=>(v-average)**2)))};
  });
  const ranked=rows.map(row=>({...row,score:baselines.reduce((sum,m)=>sum+(m.sd ? (row[m.key]-m.average)/m.sd*m.weight : 0),0)})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));
  return ranked.filter(r=>!leadersOnly || Math.abs(r.score-ranked[0].score)<1e-9).map(r=>({...r,baselines}));
}
const signed = value => `${value>=0 ? "+" : "−"}${Math.abs(value).toFixed(1)}`;
const pick = (row, reason, stats, limited=false) => ({id:row.id,name:row.name,team:row.team,reason,stats,limited});
export function baseballMvps(hitters,pitchers) {
  const hitPool=hitters.filter(p=>p.gamesPlayed>=2&&p.teamGames>=2&&p.plateAppearances>=3.1*p.teamGames);
  const pitchPool=pitchers.filter(p=>p.gamesPlayed>=2&&p.teamGames>=2&&p.outs>=3*p.teamGames);
  const hitter=rank(hitPool.map(p=>({...p,hrRate:p.homeRuns/p.teamGames,rbiRate:p.rbi/p.teamGames})),[["ops",.6],["hrRate",.25],["rbiRate",.15]]).map(p=>pick(p,
    `${p.name} combines a ${p.ops.toFixed(3)} OPS with ${p.homeRuns} home runs and ${p.rbi} RBI. The qualified-hitter average OPS is ${mean(hitPool.map(r=>r.ops)).toFixed(3)}. This combination earns the highest blended score for hitting efficiency and home-run/RBI production per team game.`,
    [{label:"OPS",value:p.ops.toFixed(3)},{label:"Home runs",value:String(p.homeRuns)},{label:"RBI",value:String(p.rbi)},{label:"Plate appearances",value:String(p.plateAppearances)}],p.teamGames<20));
  const pitcher=rank(pitchPool.map(p=>({...p,eraQuality:-p.era,whipQuality:-p.whip,kRate:p.strikeOuts/p.teamGames,ipRate:p.outs/3/p.teamGames})),[["eraQuality",.35],["whipQuality",.25],["kRate",.25],["ipRate",.15]]).map(p=>pick(p,
    `${p.name} has a ${p.era.toFixed(2)} ERA and ${p.whip.toFixed(2)} WHIP across ${Math.floor(p.outs/3)}.${p.outs%3} innings, with ${p.strikeOuts} strikeouts. Workload-qualified pitchers average a ${mean(pitchPool.map(r=>r.era)).toFixed(2)} ERA. The strongest blend of run prevention, baserunner control, strikeouts and innings earns this pick.`,
    [{label:"ERA",value:p.era.toFixed(2)},{label:"WHIP",value:p.whip.toFixed(2)},{label:"Innings",value:`${Math.floor(p.outs/3)}.${p.outs%3}`},{label:"Strikeouts",value:String(p.strikeOuts)}],p.teamGames<20));
  return { first:hitter,second:pitcher,firstLabel:"Hitter MVP",secondLabel:"Pitcher MVP",method:"Jay’s statistical picks, separate from official awards. Metrics are standardized against eligible players: hitter OPS 60%, home runs per team game 25%, RBI per team game 15%; pitcher ERA 35%, WHIP 25%, strikeouts per team game 25%, innings per team game 15%. Hitters need 3.1 plate appearances per team game; pitchers need one inning per team game. Both need two appearances. The pitcher workload threshold favors starting pitchers. Season totals combine traded players’ clubs; their workload benchmark uses the league’s average team games." };
}
export function hockeyMvps(teams) {
  // Consolidate club splits so a traded player receives one season-level evaluation.
  const collect=key=>{
    const players=new Map();
    for(const team of teams) for(const p of team[key]??[]) {
      const old=players.get(p.id);
      if(old) {for(const field of key==="players" ? ["gamesPlayed","points","goals","assists","shots"] : ["gamesPlayed","saves","shotsAgainst","goalsAgainst","timeOnIce","shutouts"]) old[field]+=p[field]; old.team="Multiple teams";old.teamGames=Math.max(old.teamGames,team.gamesPlayed);}
      else players.set(p.id,{...p,team:team.name,teamGames:team.gamesPlayed});
    }
    return [...players.values()];
  };
  const skaters=collect("players"),goalies=collect("goalies");
  const totalShots=goalies.reduce((n,p)=>n+p.shotsAgainst,0);
  const leagueSave=totalShots ? goalies.reduce((n,p)=>n+p.saves,0)/totalShots : 0;
  const skaterPool=skaters.filter(p=>p.gamesPlayed>=2&&p.gamesPlayed>=p.teamGames*.5);
  const goaliePool=goalies.filter(p=>p.gamesPlayed>=2&&p.teamGames>=2&&p.timeOnIce>=p.teamGames*1800&&p.shotsAgainst>0);
  const rankedSkaters=rank(skaterPool.map(p=>({...p,pointRate:p.points/p.teamGames,goalRate:p.goals/p.teamGames})),[["pointRate",.75],["goalRate",.25]], false);
  const skaterPicks=rankedSkaters.map(p=>pick(p,
    `${p.name} has ${p.points} points (${p.goals} goals and ${p.assists} assists) in ${p.gamesPlayed} games. Their ${p.pointRate.toFixed(2)} points per team game compares with ${mean(skaterPool.map(r=>r.points/r.teamGames)).toFixed(2)} for eligible scorers. The best combined point and goal production per team game earns this pick.`,
    [{label:"Points",value:String(p.points)},{label:"Goals",value:String(p.goals)},{label:"Assists",value:String(p.assists)},{label:"Games",value:String(p.gamesPlayed)}],p.gamesPlayed<5));
  const rankedGoalies=rank(goaliePool.map(p=>({...p,sv:p.saves/p.shotsAgainst,gsa:p.saves-p.shotsAgainst*leagueSave,gsaRate:(p.saves-p.shotsAgainst*leagueSave)/p.teamGames})),[["gsaRate",.7],["sv",.3]], false);
  const goaliePicks=rankedGoalies.map(p=>pick(p,
    `${p.name} stopped ${p.saves} of ${p.shotsAgainst} shots for a ${(p.sv*100).toFixed(1)}% save rate; the league goalie rate is ${(leagueSave*100).toFixed(1)}%. That is ${signed(p.gsa)} goals saved versus a league-average save rate on the same shot volume. The best blend of goals saved per team game and save percentage earns this pick. This measure does not adjust for shot difficulty.`,
    [{label:"Save percentage",value:p.sv.toFixed(3).replace(/^0/,"")},{label:"Goals saved vs average",value:signed(p.gsa)},{label:"Saves",value:String(p.saves)},{label:"Games",value:String(p.gamesPlayed)}],p.gamesPlayed<5));
  const skater = skaterPicks.filter((_,i)=>Math.abs(rankedSkaters[i].score-rankedSkaters[0].score)<1e-9);
  const firstRunnersUp = skaterPicks.filter(p=>!skater.some(winner=>winner.id===p.id)).slice(0,4);
  const goalie = goaliePicks.filter((_,i)=>Math.abs(rankedGoalies[i].score-rankedGoalies[0].score)<1e-9);
  const secondRunnersUp = goaliePicks.filter(p=>!goalie.some(winner=>winner.id===p.id)).slice(0,4);
  return {first:skater,second:goalie,firstRunnersUp,secondRunnersUp,firstLabel:"Skater MVP",secondLabel:"Goalie MVP",method:"Jay’s statistical picks, separate from official awards. Metrics are standardized against eligible players: skater points per team game 75% and goals per team game 25%; goalie goals saved above the league’s shot-weighted save rate per team game 70% and save percentage 30%. Skaters need two appearances and games in at least half their club’s schedule; goalies need two appearances and half their club’s available regulation ice time. At least two eligible candidates are required per category. Traded players’ club totals are combined. Regular season only."};
}
