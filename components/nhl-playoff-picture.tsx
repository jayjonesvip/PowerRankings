import type { HockeySnapshot, HockeyTeam } from "@/lib/nhl-model";
import { hockeyPlayoffPicture } from "@/lib/nhl-playoffs";
export function NhlPlayoffPicture({data}:{data:HockeySnapshot}) {
  let picture;
  try { picture=hockeyPlayoffPicture(data.teams); } catch { picture=null; }
  const tile=(team:HockeyTeam,label:string)=><div className="playoff-team"><span className="nhl-seed-label">{label}</span><span><b>{team.name}</b><small>{team.wins}–{team.losses}–{team.overtimeLosses} · {team.points} points</small></span></div>;
  return <section className="playoff-section nhl-playoff-section" id="playoff-picture"><div className="playoff-heading"><div><p className="eyebrow">Stanley Cup picture</p><h2>{data.seasonComplete ? "Playoff seeding" : "If the playoffs started today"}</h2></div><span>{data.seasonComplete ? "Final regular-season standings" : "Current regular-season standings"}</span></div>
    {picture ? <div className="playoff-brackets">{picture.map(side=><section className="conference-bracket" key={side.conference}><div className="conference-title"><span>{side.conference} Conference</span></div><div className="wild-card-label"><span>First round</span><small>Best of seven</small></div><div className="wild-card-stack">{side.matchups.map(match=><article className="playoff-matchup" key={match.home.id}>{tile(match.away,match.awayLabel)}<span className="at-label">AT</span>{tile(match.home,match.homeLabel)}</article>)}</div></section>)}</div> : <p>Waiting for a complete published standings order in the next stored snapshot.</p>}
    <p className="playoff-note">Top three in each division plus two wild cards per conference. The stronger division winner faces WC 2; the other faces WC 1. Division No. 2 faces No. 3. Ordering uses NHL’s published regular-season ranks. {data.seasonComplete ? "Opening pairings stay fixed through the postseason." : "This is an early standings snapshot, not a prediction."} Postseason results are excluded.</p>
  </section>;
}
