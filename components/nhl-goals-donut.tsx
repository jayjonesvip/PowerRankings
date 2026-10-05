import type { HockeyTeam } from "@/lib/nhl-model";
import { hockeyGoalBreakdown } from "@/lib/nhl-goals";
export function NhlGoalsDonut({teams}:{teams:HockeyTeam[]}) {
  let data;
  try { data=hockeyGoalBreakdown(teams); } catch { data=null; }
  const slices=data ? [{label:"Power-play goals",value:data.powerPlay,color:"#005a9c"},{label:"Short-handed goals",value:data.shorthanded,color:"#d50032"},{label:"Other goals",value:data.other,color:"#041e42"}] : [];
  let offset=0;
  return <section className="league-pulse" id="goal-breakdown"><div className="pulse-heading"><div><p className="eyebrow">How the league scores</p><h2>Goals by situation</h2></div><span>Regular season only</span></div>
    {data ? <div className="nhl-goals-layout"><svg viewBox="0 0 200 200" className="nhl-goals-donut" role="img" aria-label={`${data.total} total goals: ${data.powerPlay} power play, ${data.shorthanded} short handed, ${data.other} other`}><circle cx="100" cy="100" r="76" fill="none" stroke="#edf2f7" strokeWidth="24" />{slices.map(slice=>{
      const length=data.total ? slice.value/data.total*100 : 0, start=offset;offset+=length;
      return <circle key={slice.label} cx="100" cy="100" r="76" fill="none" stroke={slice.color} strokeWidth="24" pathLength="100" strokeDasharray={`${length} ${100-length}`} strokeDashoffset={-start} transform="rotate(-90 100 100)" />;
    })}<text x="100" y="100" textAnchor="middle" className="nhl-donut-total">{data.total}</text><text x="100" y="121" textAnchor="middle" className="nhl-donut-label">TOTAL GOALS</text></svg><dl className="nhl-goals-legend">{slices.map(slice=><div key={slice.label}><dt><span style={{background:slice.color}} />{slice.label}</dt><dd><b>{slice.value}</b><small>{data.total ? (slice.value/data.total*100).toFixed(1) : "0.0"}%</small></dd></div>)}</dl></div> : <p>Goal situation totals will appear after the next stored data sync.</p>}
    <p className="mlb-method">Other goals are total goals minus power-play and short-handed goals. Totals use player goals credited to each club and exclude shootout deciding goals.</p>
  </section>;
}
