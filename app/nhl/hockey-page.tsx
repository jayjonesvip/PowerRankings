"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WeeklyRankingsLink } from "@/components/weekly-rankings-link";
import { LeagueTabs } from "@/components/league-tabs";
import { NhlPlayoffPicture } from "@/components/nhl-playoff-picture";
import { LeagueMvpCards } from "@/components/league-mvps";
import { RefreshCw } from "lucide-react";
import { AdjustedLeagueLeaders } from "@/components/opponent-adjusted";
import { opponentAdjustedPerformance, hockeyScoredGames } from "@/lib/opponent-adjusted";
import { LeagueSectionLinks } from "@/components/league-section-links";
import { NhlGoalsDonut } from "@/components/nhl-goals-donut";
import { NhlTeamStats } from "@/components/nhl-team-stats";
import { NhlDivisionStandings } from "@/components/division-standings";
import type { HockeySnapshot } from "@/lib/nhl-model";
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
const NHL_SECTIONS = [
  { id: "league-leaders", label: "league leaders", view: "dashboard" as const },
  { id: "goal-breakdown", label: "goals by situation", view: "dashboard" as const },
  { id: "league-mvps", label: "league MVPs", view: "dashboard" as const },
  { id: "opponent-performance", label: "performance against opponents", view: "dashboard" as const },
  { id: "scoring-teams", label: "team scoring", view: "scoring" as const },
  { id: "goaltending-teams", label: "team goaltending", view: "goaltending" as const },
  { id: "division-standings", label: "division standings", view: "standings" as const },
  { id: "playoff-picture", label: "playoff picture", view: "standings" as const },
];
export default function HockeyPage({ initialData }: { initialData: HockeySnapshot }) {
  const [data, setData] = useState<HockeySnapshot | null>(initialData);
  const [view, setView] = useState<"dashboard" | "standings" | "scoring" | "goaltending">("dashboard");
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
    <header className="site-header"><a className="brand" href={`${base}/`}><img className="brand-mark" src={`${base}/league-snapshot-logo.png`} alt="League Snapshot logo" width="52" height="52" /><span><b>League Snapshot</b><small>NHL LEAGUE SNAPSHOT</small></span></a><nav className="league-nav" aria-label="Leagues"><a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/nfl/`}>NFL</a><a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/nhl/`}>NHL</a><a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/mlb/`}>MLB</a></nav><div className="header-status">Hourly snapshot · {data ? new Date(data.updatedAt).toLocaleString("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Loading"} ET</div></header>
    <section className="scoreboard-hero"><div><p className="eyebrow">{season} · {data?.seasonComplete ? "Regular season complete" : "Regular season"}</p><h1>NHL Snapshot<br /><em>Current snapshot</em></h1><LeagueSectionLinks sections={NHL_SECTIONS} onViewChange={setView} /></div><div className="hero-score nhl-games-count"><span>FINAL GAMES</span><strong>{data?.completedGames ?? "—"}</strong><small>Regular season</small></div></section>
    <WeeklyRankingsLink league="nhl" />
    <LeagueTabs label="NHL sections" view={view} onChange={setView} tabs={[{view:"dashboard",label:"NHL Snapshot"},{view:"standings",label:"Standings"},{view:"scoring",label:"Team Scoring"},{view:"goaltending",label:"Team Goaltending"}]} />
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
      <NhlGoalsDonut teams={data.teams} />
      <LeagueMvpCards data={data.mvps} />
      <AdjustedLeagueLeaders teams={data.teams} metrics={adjustedMetrics} sport="nhl" />
    </section>}
    {data && <section hidden={view !== "standings"} className="nhl-dashboard" id="standings-panel" role="tabpanel" aria-labelledby="standings-tab"><NhlDivisionStandings teams={data.teams} /><NhlPlayoffPicture data={data} /></section>}
    {data && <section hidden={view !== "scoring"} id="scoring-panel" role="tabpanel" aria-labelledby="scoring-tab"><NhlTeamStats teams={data.teams} view="scoring" /></section>}
    {data && <section hidden={view !== "goaltending"} id="goaltending-panel" role="tabpanel" aria-labelledby="goaltending-tab"><NhlTeamStats teams={data.teams} view="goaltending" /></section>}
    <footer><span>Unofficial analysis using NHL data. Regular season only.</span><span>Data syncs hourly; checks for updates every 5 minutes.</span></footer>
  </main>;
}
