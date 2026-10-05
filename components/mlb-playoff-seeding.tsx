import type { BaseballSnapshot } from "@/lib/mlb-model";
export function MlbPlayoffSeeding({ data }: { data: BaseballSnapshot }) {
  if (!data.playoffSeeds) return null;
  return <section className="playoff-section mlb-playoff-section" id="playoff-seeding">
    <div className="playoff-heading"><div><p className="eyebrow">{data.seasonComplete ? "Opening postseason field" : "Postseason picture"}</p><h2>{data.seasonComplete ? "Playoff seeding" : "If the playoffs started today"}</h2></div><span>{data.season} · {data.seasonComplete ? "Final regular-season standings" : "Current regular-season standings"}</span></div>
    <div className="playoff-brackets">{["American League","National League"].map(league=>{
      const seeds=data.playoffSeeds!.filter(t=>t.league===league).sort((a,b)=>a.seed-b.seed);
      const tile=(seed:number)=>{
        const pick=seeds.find(t=>t.seed===seed)!;
        const team=data.teams.find(t=>t.id===pick.id)!;
        return <div className="playoff-team"><span className="playoff-seed">{seed}</span><span><b>{team.name}</b><small>{team.wins}–{team.losses} · {pick.divisionWinner ? `${team.division} division winner` : "Wild card"}</small></span></div>;
      };
      return <section className="conference-bracket" key={league}><div className="conference-title"><span>{league}</span><small>{data.seasonComplete ? "Opening seeds" : "Current seeds"}</small></div>
        {[1,2].map(seed=><div className="bye-card" key={seed}><div><small>Wild Card Series bye</small>{tile(seed)}</div></div>)}
        <div className="wild-card-label"><span>Wild Card Series</span><small>Best of three · Higher seed hosts</small></div>
        <div className="wild-card-stack">{[[3,6],[4,5]].map(([home,away])=><article className="playoff-matchup" key={home}>{tile(away)}<span className="at-label">AT</span>{tile(home)}</article>)}</div>
      </section>;
    })}</div>
    <div className="playoff-next-round"><span>Division Series</span><b>No. 1 faces the 4/5 winner</b><i /><b>No. 2 faces the 3/6 winner</b></div>
    <p className="playoff-note">Seeds use MLB’s published regular-season division, league and wild-card ranks. Seeds 1–3 are division winners; seeds 4–6 are wild cards. {data.seasonComplete ? "This opening field stays fixed through the postseason." : "This is a snapshot of the current standings, not a postseason prediction."} No playoff results or statistics are included.</p>
  </section>;
}
