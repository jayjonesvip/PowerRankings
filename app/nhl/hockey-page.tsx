"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LeagueTabs } from "@/components/league-tabs";
import { NhlPlayoffPicture } from "@/components/nhl-playoff-picture";
import { LeagueMvpCards } from "@/components/league-mvps";
import { BarChart3, ListOrdered, RefreshCw } from "lucide-react";
import { AdjustedLeagueLeaders, AdjustedTeamMetrics } from "@/components/opponent-adjusted";
import { opponentAdjustedPerformance, hockeyScoredGames } from "@/lib/opponent-adjusted";
import { LeagueSectionLinks } from "@/components/league-section-links";
import { NhlTeamStats } from "@/components/nhl-team-stats";
import { NhlDivisionStandings } from "@/components/division-standings";
import type { HockeySnapshot } from "@/lib/nhl-model";
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
const NHL_SECTIONS = [
  { id: "league-leaders", label: "league leaders", view: "dashboard" as const },
  { id: "league-mvps", label: "league MVPs", view: "dashboard" as const },
  { id: "opponent-performance", label: "performance against opponents", view: "dashboard" as const },
  { id: "scoring-teams", label: "team scoring", view: "dashboard" as const },
  { id: "goaltending-teams", label: "team goaltending", view: "dashboard" as const },
  { id: "division-standings", label: "division standings", view: "standings" as const },
  { id: "playoff-picture", label: "playoff picture", view: "standings" as const },
  { id: "rankings", label: "power rankings", view: "rankings" as const },
];
export default function HockeyPage({ initialData }: { initialData: HockeySnapshot }) {
  const [data, setData] = useState<HockeySnapshot | null>(initialData);
  const [view, setView] = useState<"dashboard" | "rankings" | "standings">("dashboard");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${base}/data/nhl/current.json`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Stored NHL data unavailable (${response.status}).`);
      const snapshot = await response.json() as HockeySnapshot;
      if (snapshot.schemaVersion !== 1 || snapshot.teams.length !== 32) throw new Error("Invalid NHL snapshot.");
      setData(snapshot); setError(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not load stored NHL data."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); const timer = window.setInterval(load, 5 * 60 * 1000); return () => window.clearInterval(timer); }, [load]);
  const adjustedMetrics = useMemo(() => opponentAdjustedPerformance(hockeyScoredGames(data?.games ?? [])), [data]);
  const season = data ? `${String(data.season).slice(0, 4)}–${String(data.season).slice(6)}` : "Current season";
  const played = data?.teams.filter(t => t.gamesPlayed > 0) ?? [];
  const offense = [...played].sort((a, b) => b.goalsFor / b.gamesPlayed - a.goalsFor / a.gamesPlayed)[0];
  const defense = [...played].sort((a, b) => a.goalsAgainst / a.gamesPlayed - b.goalsAgainst / b.gamesPlayed)[0];
  const standings = [...(data?.teams ?? [])].sort((a, b) => b.points - a.points || b.regulationWins - a.regulationWins || a.abbreviation.localeCompare(b.abbreviation));
  const gp = played.reduce((sum, t) => sum + t.gamesPlayed, 0);
  const average = gp ? played.reduce((sum, t) => sum + t.goalsFor, 0) / gp : 0;
  return <main data-sport="nhl">
    <header className="site-header"><a className="brand" href={`${base}/`}><img className="brand-mark" src={`${base}/jays-logo.png`} alt="Jay's League Pulse logo" width="52" height="52" /><span><b>Jay&apos;s League Pulse</b><small>NHL LEAGUE SNAPSHOT</small></span></a><nav className="league-nav" aria-label="Leagues"><a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/nfl/`}>NFL</a><a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/nhl/`}>NHL</a><a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/mlb/`}>MLB</a></nav><div className="header-status">Hourly snapshot · {data ? new Date(data.updatedAt).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Loading"} ET</div></header>
    <section className="scoreboard-hero"><div><p className="eyebrow">{season} · {data?.seasonComplete ? "Regular season complete" : "Regular season"}</p><h1>NHL League Pulse<br /><em>Current snapshot</em></h1><LeagueSectionLinks sections={NHL_SECTIONS} onViewChange={setView} /></div><div className="hero-score nhl-games-count"><span>FINAL GAMES</span><strong>{data?.completedGames ?? "—"}</strong><small>Regular season</small></div></section>
    <LeagueTabs label="NHL sections" view={view} onChange={setView} tabs={[{view:"dashboard",label:"League Dashboard"},{view:"rankings",label:"Power Rankings"},{view:"standings",label:"Standings"}]} />
    <div className="controls"><span>{season} NHL · {data?.seasonComplete ? "Completed regular season" : "Current snapshot"}</span><div className="control-actions"><button onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh</button></div></div>
    {error && <section className="error-card" role="alert">{error} <button onClick={load}>Try again</button></section>}
    {!data && !error && <p className="forecast-loading">Loading league snapshot…</p>}
    {data && <section hidden={view !== "dashboard"} className="nhl-dashboard" id="dashboard-panel" role="tabpanel" aria-labelledby="dashboard-tab">
      <div className="league-pulse" id="league-leaders"><div className="pulse-heading"><div><p className="eyebrow">Around the NHL</p><h2>Current season by the numbers</h2></div><span>{data.completedGames} finals</span></div><div className="pulse-grid">
        <article><span>Points leader</span><strong>{standings[0]?.points ?? 0}</strong><b>{standings[0]?.name ?? "No games yet"}</b><small>standings points</small></article>
        <article><span>Best scoring average</span><strong>{offense ? (offense.goalsFor / offense.gamesPlayed).toFixed(2) : "—"}</strong><b>{offense?.name ?? "No games yet"}</b><small>goals per game</small></article>
        <article><span>Best defense</span><strong>{defense ? (defense.goalsAgainst / defense.gamesPlayed).toFixed(2) : "—"}</strong><b>{defense?.name ?? "No games yet"}</b><small>goals allowed per game</small></article>
        <article><span>League scoring</span><strong>{average.toFixed(2)}</strong><b>Goals per team per game</b><small>includes shootout deciding goals in standings</small></article>
      </div></div>
      <LeagueMvpCards data={data.mvps} />
      <AdjustedLeagueLeaders teams={data.teams} metrics={adjustedMetrics} sport="nhl" />
      <NhlTeamStats teams={data.teams} />
    </section>}
    {data && <section hidden={view !== "rankings"} className="nhl-dashboard" id="rankings-panel" role="tabpanel" aria-labelledby="rankings-tab"><span id="rankings" className="section-anchor" />
      {!data.rankingsReady ? <section className="league-pulse"><p className="eyebrow">Building the sample</p><h2>Rankings unlock after five games per team</h2><p>{data.teamsReady} of {data.teams.length} teams have reached five regular-season finals. Rankings activate automatically after every team qualifies.</p><div className="nhl-progress">{data.teams.map(t => <span key={t.id}>{t.abbreviation} <b>{Math.min(t.gamesPlayed, data.minimumGames)}/{data.minimumGames}</b></span>)}</div></section> : <section className="rankings-card"><div className="section-heading"><h2>All 32 NHL power rankings</h2><span>{season}</span></div><div className="nhl-table-wrap"><table className="nhl-table"><thead><tr><th>Rank</th><th>Team</th><th>W–L–OTL</th><th>Jay’s Index</th><th>GF/G</th><th>GA/G</th><th>Last 5</th><th>Opponent performance</th></tr></thead><tbody>{data.rankings.map(t => <tr key={t.id}><td><span className={`rank-number rank-${t.rank}`}>{t.rank}</span></td><td><b>{t.name}</b><small>Record {t.components.record.toFixed(1)} · Quality {t.components.quality.toFixed(1)}</small></td><td>{t.wins}–{t.losses}–{t.overtimeLosses}</td><td><b>{t.score.toFixed(1)}</b></td><td>{t.goalsForAverage.toFixed(2)}</td><td>{t.goalsAgainstAverage.toFixed(2)}</td><td>{t.recent.join(" · ")}</td><td><AdjustedTeamMetrics data={adjustedMetrics.get(t.id)} sport="nhl" /></td></tr>)}</tbody></table></div></section>}
      <aside className="method-card nhl-method"><h2>How the index works</h2><p>Standings points percentage 25% · Win quality 30% · Offense 20% · Defense 20% · Last five games 5%.</p><p>Wins earn two standings points; overtime and shootout losses earn one. Win quality combines opponent points percentage (80%) and goal margin (20%). Goals per game are compared with the league average. The index is Jay&apos;s model, separate from official standings.</p></aside>
    </section>}
    {data && <section hidden={view !== "standings"} className="nhl-dashboard" id="standings-panel" role="tabpanel" aria-labelledby="standings-tab"><NhlDivisionStandings teams={data.teams} /><NhlPlayoffPicture data={data} /></section>}
    <footer><span>Unofficial analysis using NHL data. Regular season only.</span><span>Data syncs hourly; checks for updates every 5 minutes.</span></footer>
  </main>;
}
