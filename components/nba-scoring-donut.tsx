import { basketballScoringBreakdown, type NbaScoring } from "@/lib/nba-scoring";
export function NbaScoringDonut({scoring}:{scoring?:NbaScoring}) {
  const data=scoring?basketballScoringBreakdown(scoring):null;
  const slices=data?[{label:"Free throws",value:data.freeThrows,made:scoring!.freeThrowsMade,color:"#d50032"},{label:"Three-pointers",value:data.threePointers,made:scoring!.threePointersMade,color:"#005a9c"},{label:"Two-point field goals",value:data.twoPointers,made:scoring!.twoPointersMade,color:"#041e42"}]:[];
  let offset=0;
  const number=(value:number)=>value.toLocaleString("en-US");
  return <section className="league-pulse" id="scoring-breakdown"><div className="pulse-heading"><div><p className="eyebrow">How the league scores</p><h2>Points by scoring type</h2></div><span>Regular season only</span></div>
    {data?<div className="nhl-goals-layout"><svg viewBox="0 0 200 200" className="nhl-goals-donut" role="img" aria-label={`${data.total} total points: ${data.freeThrows} from free throws, ${data.threePointers} from three-pointers, ${data.twoPointers} from two-point field goals`}><circle cx="100" cy="100" r="76" fill="none" stroke="#edf2f7" strokeWidth="24"/>{slices.filter(s=>s.value>0).map(slice=>{
      const length=data.total?slice.value/data.total*100:0,start=offset;offset+=length;
      return <circle key={slice.label} cx="100" cy="100" r="76" fill="none" stroke={slice.color} strokeWidth="24" pathLength="100" strokeDasharray={`${length} ${100-length}`} strokeDashoffset={-start} transform="rotate(-90 100 100)"/>;
    })}<text x="100" y="100" textAnchor="middle" className="nhl-donut-total" style={{fontSize:number(data.total).length>6?24:28}}>{number(data.total)}</text><text x="100" y="121" textAnchor="middle" className="nhl-donut-label">TOTAL POINTS</text></svg><dl className="nhl-goals-legend">{slices.map(slice=><div key={slice.label}><dt><span style={{background:slice.color}}/>{slice.label}</dt><dd><b>{number(slice.value)} pts</b><small>{data.total?(slice.value/data.total*100).toFixed(1):"0.0"}% · {number(slice.made)} made</small></dd></div>)}</dl></div>:<p>Scoring types will appear after the next stored data sync.</p>}
    <p className="mlb-method">Slices show points contributed: 1 per made free throw, 3 per made three-pointer, and 2 per made two-point field goal. Two-pointers are total field goals made minus three-pointers made. All completed regular-season games count, including overtime.</p>
  </section>;
}
