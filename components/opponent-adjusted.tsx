import type { AdjustedPerformance } from "@/lib/opponent-adjusted";
const signed = (value: number) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}`;
const sample = (data: AdjustedPerformance) => `${data.qualifyingGames}/${data.totalGames} qualifying games${data.qualifyingGames < 5 ? " · Limited sample" : ""}`;
export function AdjustedTeamMetrics({ data, sport }: { data?: AdjustedPerformance; sport: "nfl" | "nhl" }) {
  const unit = sport === "nfl" ? "points" : "goals";
  const available = data && data.qualifyingGames > 0;
  return <div className="adjusted-team-metrics">
    <div><span>Offense above expectation</span><strong>{available ? signed(data.offense!) : "—"}</strong><small>{unit} per game</small></div>
    <div><span>Defensive suppression</span><strong>{available ? signed(data.defense!) : "—"}</strong><small>{unit} per game</small></div>
    <p>{available ? `Scores ${Math.abs(data.offense!).toFixed(1)} ${unit} ${data.offense! >= 0 ? "more" : "fewer"} than opponents usually allow; allows ${Math.abs(data.defense!).toFixed(1)} ${unit} ${data.defense! >= 0 ? "below" : "above"} their usual scoring.` : "Waiting for opponents to have at least two other completed games."}</p>
    {data && <small className="adjusted-sample">{sample(data)}</small>}
  </div>;
}
export function AdjustedLeagueLeaders({ teams, metrics, sport }: { teams: Array<{ id: string; name: string }>; metrics: Map<string, AdjustedPerformance>; sport: "nfl" | "nhl" }) {
  const unit = sport === "nfl" ? "points" : "goals";
  const eligible = teams.map(team => ({ ...team, metric: metrics.get(team.id) })).filter(team => team.metric && team.metric.qualifyingGames >= 3);
  return <section className="adjusted-leaders" id="opponent-performance" aria-label="Opponent-adjusted performance">
    <div className="dashboard-heading"><div><p className="eyebrow">Beyond the box score</p><h2>Performance against opponents</h2></div><span>Higher is better for both</span></div>
    <div className="adjusted-leader-grid">{(["offense", "defense"] as const).map(side => {
      const leaders = [...eligible].sort((a, b) => b.metric![side]! - a.metric![side]! || a.name.localeCompare(b.name)).slice(0, 3);
      return <article className="data-panel" key={side}><div className="panel-title"><h3>{side === "offense" ? "Offense above expectation" : "Defensive suppression"}</h3></div>
        {leaders.length ? <ol>{leaders.map(team => <li key={team.id}><div><b>{team.name}</b><small>{sample(team.metric!)}</small></div><strong>{signed(team.metric![side]!)}<small>{unit}/game</small></strong></li>)}</ol> : <p className="adjusted-empty">Leaders appear after teams have three qualifying games.</p>}
      </article>;
    })}</div>
    <p className="adjusted-method">Each game is compared with the opponent’s scoring and points/goals allowed in its other completed games, excluding that game. An opponent needs two other games; each qualifying game has equal weight. Positive values mean scoring above the opponent’s usual allowance or allowing below its usual scoring. These are historical comparisons, not pregame predictions.{sport === "nhl" ? " Shootout deciding goals are excluded; overtime goals count." : " Scoring includes offense, defense and special teams."} Samples under five qualifying games are limited.</p>
  </section>;
}
