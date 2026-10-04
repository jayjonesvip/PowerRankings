"use client";
import { useCallback, useEffect, useState } from "react";
import { BarChart3, ListOrdered, RefreshCw } from "lucide-react";
import type { HockeySnapshot } from "@/lib/nhl-model";
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
export default function HockeyPage() {
  const [data, setData] = useState<HockeySnapshot | null>(null);
  const [view, setView] = useState<"dashboard" | "rankings">("dashboard");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
  const season = data ? `${String(data.season).slice(0, 4)}–${String(data.season).slice(6)}` : "Current season";
  const played = data?.teams.filter(t => t.gamesPlayed > 0) ?? [];
  const offense = [...played].sort((a, b) => b.goalsFor / b.gamesPlayed - a.goalsFor / a.gamesPlayed)[0];
  const defense = [...played].sort((a, b) => a.goalsAgainst / a.gamesPlayed - b.goalsAgainst / b.gamesPlayed)[0];
  const standings = [...(data?.teams ?? [])].sort((a, b) => b.points - a.points || b.regulationWins - a.regulationWins || a.abbreviation.localeCompare(b.abbreviation));
  const gp = played.reduce((sum, t) => sum + t.gamesPlayed, 0);
  const average = gp ? played.reduce((sum, t) => sum + t.goalsFor, 0) / gp : 0;
  const finals = data?.games.filter(g => g.completed).slice(-8).reverse() ?? [];
  const upcoming = data?.games.filter(g => !g.completed && ["FUT", "PRE", "LIVE", "CRIT"].includes(g.state)).slice(0, 8) ?? [];
  return <main>
    <header className="site-header"><a className="brand" href={`${base}/`}><img className="brand-mark" src={`${base}/jays-logo.png`} alt="Jay's Power Rankings logo" width="52" height="52" /><span><b>Jay&apos;s Power Rankings</b><small>NHL POWER INDEX</small></span></a><div className="header-status">Hourly snapshot · {data ? new Date(data.updatedAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Loading"}</div></header>
    <section className="scoreboard-hero"><div><p className="eyebrow">{season} · Regular season</p><h1>On the ice.<br /><em>On the board.</em></h1><p className="hero-copy">League leaders, final scores, and NHL power rankings built from standings points, opponent quality, goals, and recent form.</p></div><div className="hero-score"><span>GAMES COUNTED</span><strong>{data?.completedGames ?? "—"}</strong><small>REGULAR-SEASON FINALS</small></div></section>
    <nav className="view-tabs" aria-label="NHL sections"><button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><BarChart3 />League Dashboard</button><button className={view === "rankings" ? "active" : ""} onClick={() => setView("rankings")}><ListOrdered />Power Rankings</button></nav>
    <div className="controls"><span>{season} NHL</span><div className="control-actions"><button onClick={load} disabled={loading}><RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh</button></div></div>
    {error && <section className="error-card" role="alert">{error} <button onClick={load}>Try again</button></section>}
    {!data && !error && <p className="forecast-loading">Loading league snapshot…</p>}
    {data && view === "dashboard" && <section className="nhl-dashboard">
      <div className="league-pulse"><div className="pulse-heading"><div><p className="eyebrow">Around the NHL</p><h2>League dashboard</h2></div><span>{data.completedGames} finals</span></div><div className="pulse-grid">
        <article><span>Points leader</span><strong>{standings[0]?.points ?? 0}</strong><b>{standings[0]?.name ?? "No games yet"}</b><small>standings points</small></article>
        <article><span>Best scoring average</span><strong>{offense ? (offense.goalsFor / offense.gamesPlayed).toFixed(2) : "—"}</strong><b>{offense?.name ?? "No games yet"}</b><small>goals per game</small></article>
        <article><span>Best defense</span><strong>{defense ? (defense.goalsAgainst / defense.gamesPlayed).toFixed(2) : "—"}</strong><b>{defense?.name ?? "No games yet"}</b><small>goals allowed per game</small></article>
        <article><span>League scoring</span><strong>{average.toFixed(2)}</strong><b>Goals per team per game</b><small>includes shootout deciding goals in standings</small></article>
      </div></div>
      <div className="nhl-games"><section className="rankings-card"><div className="section-heading"><h2>Recent finals</h2></div><div className="nhl-game-list">{finals.length ? finals.map(g => <div key={g.id}><span>{g.away} at {g.home}</span><b>{g.awayScore}–{g.homeScore} {g.decision !== "REG" ? g.decision : ""}</b><small>{new Date(g.date).toLocaleDateString()}</small></div>) : <p>No regular-season finals yet.</p>}</div></section><section className="rankings-card"><div className="section-heading"><h2>Upcoming games</h2></div><div className="nhl-game-list">{upcoming.length ? upcoming.map(g => <div key={g.id}><b>{g.away} at {g.home}</b><small>{new Date(g.date).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</small><span>{["LIVE", "CRIT"].includes(g.state) ? "In progress" : "Scheduled"}</span></div>) : <p>No upcoming regular-season games in this snapshot.</p>}</div></section></div>
      <section className="rankings-card"><div className="section-heading"><h2>League standings</h2><span>W–L–OTL</span></div><div className="nhl-table-wrap"><table className="nhl-table"><thead><tr><th>Team</th><th>GP</th><th>W–L–OTL</th><th>PTS</th><th>GF</th><th>GA</th><th>DIFF</th></tr></thead><tbody>{standings.map(t => <tr key={t.id}><td><b>{t.name}</b><small>{t.conference} · {t.division}</small></td><td>{t.gamesPlayed}</td><td>{t.wins}–{t.losses}–{t.overtimeLosses}</td><td>{t.points}</td><td>{t.goalsFor}</td><td>{t.goalsAgainst}</td><td>{t.goalsFor - t.goalsAgainst}</td></tr>)}</tbody></table></div><p className="nhl-note">Sorted by points, regulation wins, then abbreviation. Tied rows do not apply all official playoff tiebreakers.</p></section>
    </section>}
    {data && view === "rankings" && <section className="nhl-dashboard">
      {!data.rankingsReady ? <section className="league-pulse"><p className="eyebrow">Building the sample</p><h2>Rankings unlock after five games per team</h2><p>{data.teamsReady} of {data.teams.length} teams have reached five regular-season finals. Rankings activate automatically after every team qualifies.</p><div className="nhl-progress">{data.teams.map(t => <span key={t.id}>{t.abbreviation} <b>{Math.min(t.gamesPlayed, data.minimumGames)}/{data.minimumGames}</b></span>)}</div></section> : <section className="rankings-card"><div className="section-heading"><h2>All 32 NHL power rankings</h2><span>{season}</span></div><div className="nhl-table-wrap"><table className="nhl-table"><thead><tr><th>Rank</th><th>Team</th><th>W–L–OTL</th><th>Index</th><th>GF/G</th><th>GA/G</th><th>Last 5</th></tr></thead><tbody>{data.rankings.map(t => <tr key={t.id}><td><span className={`rank-number rank-${t.rank}`}>{t.rank}</span></td><td><b>{t.name}</b><small>Record {t.components.record.toFixed(1)} · Quality {t.components.quality.toFixed(1)}</small></td><td>{t.wins}–{t.losses}–{t.overtimeLosses}</td><td><b>{t.score.toFixed(1)}</b></td><td>{t.goalsForAverage.toFixed(2)}</td><td>{t.goalsAgainstAverage.toFixed(2)}</td><td>{t.recent.join(" · ")}</td></tr>)}</tbody></table></div></section>}
      <aside className="method-card nhl-method"><h2>How the index works</h2><p>Standings points percentage 25% · Win quality 30% · Offense 20% · Defense 20% · Last five games 5%.</p><p>Wins earn two standings points; overtime and shootout losses earn one. Win quality combines opponent points percentage (80%) and goal margin (20%). Goals per game are compared with the league average. The index is Jay&apos;s model, separate from official standings.</p></aside>
    </section>}
    <footer><span>Unofficial analysis using NHL data. Regular season only.</span><span>Data syncs hourly; checks for updates every 5 minutes.</span></footer>
  </main>;
}
