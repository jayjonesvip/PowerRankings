"use client";
import { SortableStats } from "@/components/sortable-stats";
import type { HockeyTeam } from "@/lib/nhl-model";
export function NhlTeamStats({teams}:{teams:HockeyTeam[]}) {
  const scoring = teams.map(t => {
    const players = t.players ?? [];
    const sum = (key:"goals"|"assists"|"points"|"shots") => players.reduce((n,p)=>n+p[key],0);
    return {id:t.id,name:t.name,gamesPlayed:t.gamesPlayed,goals:sum("goals"),assists:sum("assists"),points:sum("points"),shots:sum("shots"),goalsPerGame:t.gamesPlayed ? sum("goals")/t.gamesPlayed : null,shooting:sum("shots") ? sum("goals")/sum("shots") : null};
  });
  const goalkeeping = teams.map(t => {
    const sum = (key:"saves"|"shotsAgainst"|"goalsAgainst"|"shutouts"|"timeOnIce") => (t.goalies??[]).reduce((n,p)=>n+p[key],0);
    return {id:t.id,name:t.name,gamesPlayed:t.gamesPlayed,saves:sum("saves"),shotsAgainst:sum("shotsAgainst"),goalsAgainst:sum("goalsAgainst"),shutouts:sum("shutouts"),savePercentage:sum("shotsAgainst") ? sum("saves")/sum("shotsAgainst") : null,gaa:sum("timeOnIce") ? sum("goalsAgainst")*3600/sum("timeOnIce") : null};
  });
  return <><SortableStats id="scoring-teams" title="Team scoring" defaultKey="points" rows={scoring} columns={[{key:"name",label:"Team"},{key:"gamesPlayed",label:"GP"},{key:"goals",label:"Goals"},{key:"assists",label:"Assists"},{key:"points",label:"PTS"},{key:"goalsPerGame",label:"G/G",format:v=>v.toFixed(2)},{key:"shots",label:"Shots"},{key:"shooting",label:"Shot %",format:v=>`${(v*100).toFixed(1)}%`}]} details={id => <div className="nhl-player-details"><h3>{teams.find(t=>t.id===id)?.name} · Player points</h3><table className="nhl-table"><thead><tr><th>Player</th><th>Pos</th><th>GP</th><th>Goals</th><th>Assists</th><th>PTS</th></tr></thead><tbody>{[...(teams.find(t=>t.id===id)?.players??[])].filter(p=>p.points>0).sort((a,b)=>b.points-a.points||b.goals-a.goals||a.name.localeCompare(b.name)).map(p=><tr key={p.id}><th scope="row">{p.name}</th><td>{p.position}</td><td>{p.gamesPlayed}</td><td>{p.goals}</td><td>{p.assists}</td><td><b>{p.points}</b></td></tr>)}</tbody></table></div>} />
  <p className="mlb-method">PTS is player scoring points (goals + assists), separate from standings points. Select a team’s PTS to show players who have scored at least one point. Club scoring excludes shootout deciding goals; player totals reflect statistics credited to this club.</p>
  <SortableStats id="goaltending-teams" title="Team goaltending" defaultKey="savePercentage" rows={goalkeeping} columns={[{key:"name",label:"Team"},{key:"gamesPlayed",label:"GP"},{key:"savePercentage",label:"SV%",format:v=>v.toFixed(3).replace(/^0/,"")},{key:"gaa",label:"GAA",lowerFirst:true,format:v=>v.toFixed(2)},{key:"saves",label:"Saves"},{key:"shotsAgainst",label:"Shots faced"},{key:"goalsAgainst",label:"Goals allowed",lowerFirst:true},{key:"shutouts",label:"Shutouts"}]} />
  <p className="mlb-method">SV% is combined goalie saves divided by shots faced. GAA is goals allowed per 60 minutes of goalie ice time. Rates use combined totals, rather than averaging individual goalies; empty-net goals are excluded. Regular season only.</p></>;
}
