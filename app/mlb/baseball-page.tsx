"use client";
import { useCallback, useEffect, useState } from "react";
import { SortableStats } from "@/components/sortable-stats";
import { LeagueMvpCards } from "@/components/league-mvps";
import { RefreshCw } from "lucide-react";
import { validateBaseballSnapshot, type BaseballSnapshot, type BaseballTeam, type BaseballLeader } from "@/lib/mlb-model";
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
const HITTING_COLUMNS = [
  { key: "name", label: "Team" }, { key: "battingAverage", label: "AVG" }, { key: "hitPercentage", label: "Hit %" },
  { key: "hits", label: "Hits" }, { key: "atBats", label: "At-bats" }, { key: "homeRuns", label: "HR" }, { key: "runsFor", label: "Runs" },
] as const;
type HittingSort = typeof HITTING_COLUMNS[number]["key"];
const avg = (value: number) => value.toFixed(3).replace(/^0/, "");
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const extrema = (teams: BaseballTeam[], key: "battingAverage" | "era" | "homeRuns" | "wins" | "losses", lowest = false) => {
  const rows = teams.filter(t => t.gamesPlayed > 0);
  if (!rows.length) return [];
  const value = (lowest ? Math.min : Math.max)(...rows.map(t => t[key]));
  return rows.filter(t => t[key] === value).map(t => ({ id: t.id, name: t.name, team: "", value }));
};
function LeaderCard({ label, rows, format, detail }: { label: string; rows: BaseballLeader[]; format: (value: number) => string; detail: string }) {
  return <article><span>{label}</span><strong>{rows.length ? format(rows[0].value) : "—"}</strong>
    {rows.map(row => <div className="mlb-leader-name" key={row.id}><b>{row.name}</b>{row.team && <small>{row.team}</small>}</div>)}
    <small>{detail}{rows.length > 1 ? " · Tied leaders" : ""}</small></article>;
}
export default function BaseballPage({ initialData }: { initialData: BaseballSnapshot }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${base}/data/mlb/current.json`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Stored MLB data unavailable (${response.status}).`);
      setData(validateBaseballSnapshot(await response.json())); setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load MLB snapshot."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); const timer = window.setInterval(load, 5 * 60 * 1000); return () => window.clearInterval(timer); }, [load]);
  const [hittingSort, setHittingSort] = useState<{ key: HittingSort; direction: "ascending" | "descending" }>({ key: "battingAverage", direction: "descending" });
  const sortHitting = (key: HittingSort) => setHittingSort(current => ({ key, direction: current.key === key ? (current.direction === "ascending" ? "descending" : "ascending") : key === "name" ? "ascending" : "descending" }));
  const hitting = [...data.teams].sort((a, b) => {
    const key = hittingSort.key === "hitPercentage" ? "battingAverage" : hittingSort.key;
    const comparison = key === "name" ? a.name.localeCompare(b.name) : a[key] - b[key];
    return (hittingSort.direction === "ascending" ? comparison : -comparison) || a.name.localeCompare(b.name);
  });

  const count = (value: number) => String(value);
  return <main data-sport="mlb">
    <header className="site-header"><a className="brand" href={`${base}/`} aria-label="Jay's League Pulse home"><img className="brand-mark" src={`${base}/jays-logo.png`} alt="Jay's League Pulse logo" width="52" height="52" /><span><b>Jay&apos;s League Pulse</b><small>MLB LEAGUE SNAPSHOT</small></span></a>
      <nav className="league-nav" aria-label="Leagues"><a href={`${base}/nfl/`}>NFL</a><a href={`${base}/nhl/`}>NHL</a><a href={`${base}/mlb/`} aria-current="page">MLB</a></nav>
      <div className="header-status">Hourly snapshot · {new Date(data.updatedAt).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} ET</div>
    </header>
    <section className="scoreboard-hero"><div><p className="eyebrow">{data.season} · Regular season{data.seasonComplete ? " complete" : ""}</p><h1>MLB League Pulse<br /><em>Regular-season snapshot</em></h1>
      <p className="hero-copy league-intro">Explore <a href="#division-standings">division standings</a>, <a href="#league-leaders">league leaders</a>, <a href="#league-mvps">league MVPs</a>, <a href="#hitting-teams">team hitting</a>, and <a href="#pitching-teams">team pitching</a>—regular-season results only.</p></div>
      <div className="hero-score mlb-games-count nhl-games-count"><span>FINAL GAMES</span><strong>{data.completedGames}</strong><small>Regular season</small></div></section>
    <div className="controls"><span>{data.season} MLB · {data.seasonComplete ? "Completed regular season" : "Current regular season"}</span><div className="control-actions"><button onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? "spin" : ""} />Refresh</button></div></div>
    {error && <section className="error-card" role="alert">Showing the last successful snapshot. {error}<button onClick={load}>Try again</button></section>}
    <section className="division-standings" id="division-standings"><div className="dashboard-heading"><div><p className="eyebrow">Division race</p><h2>Standings by division</h2></div><span>{data.season} regular season</span></div>
      {["American League", "National League"].map(league => <section className="standings-conference" key={league}><h3>{league}</h3><div className="division-grid">
        {["East", "Central", "West"].map(division => {
          const teams = data.teams.filter(t => t.league === league && t.division === division).sort((a, b) => a.divisionRank - b.divisionRank);
          const leader = teams[0];
          return <section className="rankings-card" key={division}><div className="section-heading"><h4>{league === "American League" ? "AL" : "NL"} {division}</h4></div><div className="nhl-table-wrap"><table className="nhl-table"><caption className="sr-only">{league} {division} regular-season standings</caption>
            <thead><tr><th scope="col">Team</th><th scope="col">W–L</th><th scope="col">PCT</th><th scope="col">GB</th><th scope="col">AVG</th><th scope="col">ERA</th><th scope="col">HR</th></tr></thead>
            <tbody>{teams.map(t => <tr key={t.id}><th scope="row"><b>{t.name}</b></th><td>{t.wins}–{t.losses}</td><td>{t.gamesPlayed ? avg(t.wins / t.gamesPlayed) : "—"}</td><td>{t.id === leader.id ? "—" : ((leader.wins - t.wins + t.losses - leader.losses) / 2).toFixed(1)}</td><td>{avg(t.battingAverage)}</td><td>{t.era.toFixed(2)}</td><td>{t.homeRuns}</td></tr>)}</tbody>
          </table></div></section>;
        })}</div></section>)}
    </section>
    <LeagueMvpCards data={data.mvps} />
    <section className="league-pulse mlb-pulse" id="league-leaders"><div className="pulse-heading"><div><p className="eyebrow">Around MLB</p><h2>Regular-season leaders and extremes</h2></div><span>{data.teams.length} teams</span></div><div className="pulse-grid">
      <LeaderCard label="Best hitting team" rows={extrema(data.teams, "battingAverage")} format={value => `${avg(value)} · ${percent(value)}`} detail="Highest team batting average" />
      <LeaderCard label="Worst hitting team" rows={extrema(data.teams, "battingAverage", true)} format={value => `${avg(value)} · ${percent(value)}`} detail="Lowest team batting average" />
      <LeaderCard label="Best pitching team" rows={extrema(data.teams, "era", true)} format={value => value.toFixed(2)} detail="Lowest team ERA" />
      <LeaderCard label="Worst pitching team" rows={extrema(data.teams, "era")} format={value => value.toFixed(2)} detail="Highest team ERA" />
      <article><span>Total home runs</span><strong>{data.totalHomeRuns.toLocaleString("en-US")}</strong><b>All 30 teams</b><small>Regular-season home runs</small></article>
      <LeaderCard label="Most team home runs" rows={extrema(data.teams, "homeRuns")} format={count} detail="Team home-run total" />
      <LeaderCard label="Player home-run leader" rows={data.leaders.homeRuns} format={count} detail="Home runs · All hitters" />
      <LeaderCard label="Player batting-average leader" rows={data.leaders.battingAverage} format={value => `${avg(value)} · ${percent(value)}`} detail="MLB-qualified hitters" />
      <LeaderCard label="Most team wins" rows={extrema(data.teams, "wins")} format={count} detail="Regular-season wins" />
      <LeaderCard label="Most team losses" rows={extrema(data.teams, "losses")} format={count} detail="Regular-season losses" />
      <LeaderCard label="Pitcher wins leader" rows={data.leaders.wins} format={count} detail="Pitcher wins" />
      <LeaderCard label="Pitcher losses leader" rows={data.leaders.losses} format={count} detail="Pitcher losses" />
    </div><p className="mlb-method">Batting average is hits divided by at-bats; percentages show the same rate. ERA measures earned runs allowed per nine innings; lower is better. These best/worst labels use batting average and ERA, rather than an overall team-strength model. Player batting-average leaders use MLB’s qualified hitter pool. Ties use the published precision. Postseason and spring-training statistics are excluded.</p></section>
    <section className="rankings-card mlb-team-stats" id="hitting-teams"><div className="section-heading"><h2>Team hitting</h2><span>Sort: {HITTING_COLUMNS.find(column => column.key === hittingSort.key)?.label} · {hittingSort.direction === "ascending" ? "Ascending" : "Descending"}</span></div><div className="nhl-table-wrap"><table className="nhl-table"><thead><tr>{HITTING_COLUMNS.map(column => <th scope="col" key={column.key} aria-sort={hittingSort.key === column.key ? hittingSort.direction : "none"}><button className="mlb-sort-button" onClick={() => sortHitting(column.key)} aria-label={`Sort by ${column.label}, ${hittingSort.key === column.key && hittingSort.direction === "descending" ? "ascending" : hittingSort.key === column.key ? "descending" : column.key === "name" ? "ascending" : "descending"}`}>
      {column.label}<span aria-hidden="true">{hittingSort.key === column.key ? hittingSort.direction === "ascending" ? "↑" : "↓" : "↕"}</span>
    </button></th>)}</tr></thead><tbody>{hitting.map(t => <tr key={t.id}><th scope="row">{t.name}</th><td>{avg(t.battingAverage)}</td><td>{percent(t.battingAverage)}</td><td>{t.hits}</td><td>{t.atBats}</td><td>{t.homeRuns}</td><td>{t.runsFor}</td></tr>)}</tbody></table></div></section>
    <SortableStats id="pitching-teams" title="Team pitching" defaultKey="era" rows={data.teams.map(t => ({id:String(t.id),name:t.name,era:t.era,runsAgainst:t.runsAgainst,gamesPlayed:t.gamesPlayed,wins:t.wins,losses:t.losses}))} columns={[{key:"name",label:"Team"},{key:"era",label:"ERA",lowerFirst:true,format:v=>v.toFixed(2)},{key:"runsAgainst",label:"Runs allowed",lowerFirst:true},{key:"gamesPlayed",label:"Games"},{key:"wins",label:"Wins"},{key:"losses",label:"Losses",lowerFirst:true}]} />
    <footer><span>Unofficial analysis using MLB data. Regular season only.</span><span>Data syncs hourly; checks for updates every 5 minutes.</span></footer>
  </main>;
}
