"use client";

import { AdjustedLeagueLeaders } from "@/components/opponent-adjusted";
import { opponentAdjustedPerformance } from "@/lib/opponent-adjusted";
import { snapshotUpdatedAt, publishedNflSeason } from "@/lib/local-data";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NflDivisionStandings } from "@/components/division-standings";
import { LeagueSectionLinks } from "@/components/league-section-links";
import { NflLeagueMvps } from "@/components/nfl-league-mvps";
import { LeagueTabs } from "@/components/league-tabs";
import { LeagueDashboard } from "@/components/league-dashboard";
import { WeeklyRankingsLink } from "@/components/weekly-rankings-link";
import { PlayoffBracket } from "@/components/playoff-bracket";
import { buildSnapshots, fetchSeasonGames, type Game, type SeasonSnapshot } from "@/lib/rankings";

const NFL_SECTIONS = [
  { id: "league-stats", label: "league stats", view: "dashboard" as const },
  { id: "touchdown-types", label: "touchdown types", view: "dashboard" as const },
  { id: "distance-records", label: "distance records", view: "dashboard" as const },
  { id: "game-records", label: "game records", view: "dashboard" as const },
  { id: "league-mvps", label: "offensive and defensive MVPs", view: "dashboard" as const },
  { id: "opponent-performance", label: "performance against opponents", view: "dashboard" as const },
  { id: "division-standings", label: "division standings", view: "standings" as const },
  { id: "playoff-picture", label: "playoff picture", view: "standings" as const },
];
export default function NflPage({ initial }: { initial: Awaited<ReturnType<typeof import("@/lib/build-snapshot").buildNflSnapshot>> }) {
  const [season,setSeason] = useState(initial.season);
  const [seasonComplete,setSeasonComplete] = useState(initial.seasonComplete);
  const [snapshots, setSnapshots] = useState<SeasonSnapshot[]>(initial.snapshots);
  const [games, setGames] = useState<Game[]>(initial.games);
  const [view, setView] = useState<"dashboard" | "standings">("dashboard");
  const [dashboardRefresh, setDashboardRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(() => new Date(initial.updatedAt));

  const load = useCallback(async (selectedSeason: number, quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const published = await publishedNflSeason();
      selectedSeason = published.season;
      const games = await fetchSeasonGames(selectedSeason);
      setSeason(selectedSeason); setSeasonComplete(published.seasonComplete);
      setGames(games);
      const nextSnapshots = buildSnapshots(games);
      setSnapshots(nextSnapshots);
      setDashboardRefresh((value) => value + 1);
      setUpdatedAt(await snapshotUpdatedAt(selectedSeason));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Stored NFL data could not be loaded.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load(season);
    const timer = window.setInterval(() => load(season, true), 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [season, load]);

  const adjustedMetrics = useMemo(() => opponentAdjustedPerformance(games), [games]);
  const snapshot = snapshots.at(-1);
  const week = snapshot?.week ?? 1;
  return (
    <main data-sport="nfl">
      <header className="site-header">
        <a className="brand" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/`} aria-label="League Snapshot home"><img className="brand-mark" src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/league-snapshot-logo.png`} alt="League Snapshot sports analytics logo" width="52" height="52" /><span><b>League Snapshot</b><small>NFL LEAGUE SNAPSHOT</small></span></a>
        <nav className="league-nav" aria-label="Leagues"><a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/nfl/`}>NFL</a><a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/nhl/`}>NHL</a><a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/mlb/`}>MLB</a></nav><div className="header-status"><span className="live-dot" /> Hourly snapshot<span className="divider" />{updatedAt ? `Updated ${updatedAt.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })} ET` : "Loading"}</div>
      </header>

      <section className="scoreboard-hero">
        <div><p className="eyebrow">NFL standings, standouts, and team performance</p><h1>NFL Snapshot<br /><em>Current snapshot</em></h1><LeagueSectionLinks sections={NFL_SECTIONS} onViewChange={setView} /></div>
        <div className="hero-score"><span>WEEK</span><strong>{String(week).padStart(2, "0")}</strong><small>{snapshot?.completedGames ?? 0} FINAL GAMES</small></div>
      </section>

      <WeeklyRankingsLink league="nfl" />
      <LeagueTabs label="NFL sections" view={view} onChange={setView} tabs={[{view:"dashboard",label:"NFL Snapshot"},{view:"standings",label:"Standings"}]} />

      <section className="controls" aria-label="Current snapshot controls">
        <span>{season} NFL · {seasonComplete ? "Completed regular season" : "Current snapshot"}</span>
        <div className="control-actions"><Button onClick={() => { load(season); }} disabled={loading}><RefreshCw className={loading ? "spin" : ""} />Refresh</Button></div>
      </section>

      {error ? <section className="error-card" role="alert"><strong>Couldn’t reach ESPN.</strong> {error}<Button onClick={() => load(season)}>Try again</Button></section> : null}

      {<section className="dashboard-view" id="dashboard-panel" role="tabpanel" aria-labelledby="dashboard-tab" hidden={view !== "dashboard"}><LeagueDashboard season={season} week={week} refreshToken={dashboardRefresh} initialData={initial.dashboard} /><NflLeagueMvps season={season} completedGames={snapshot?.completedGames ?? 0} refreshToken={dashboardRefresh} initialData={initial.mvp} /><AdjustedLeagueLeaders teams={snapshot?.teams ?? []} metrics={adjustedMetrics} sport="nfl" /></section>}

      <section className="dashboard-view" id="standings-panel" role="tabpanel" aria-labelledby="standings-tab" hidden={view !== "standings"}><NflDivisionStandings games={games} teams={snapshot?.teams ?? []} week={week} /><PlayoffBracket games={games} teams={snapshot?.teams ?? []} week={week} seasonComplete={seasonComplete} /></section>
      <footer><span>Unofficial league analysis using publicly available ESPN data.</span><span>Data syncs hourly; checks for updates every 5 minutes.</span></footer>
    </main>
  );
}
