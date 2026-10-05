"use client";

import { currentNflSeason, snapshotUpdatedAt } from "@/lib/local-data";
import { validateBaseballSnapshot, type BaseballSnapshot } from "@/lib/mlb-model";
import type { HockeySnapshot } from "@/lib/nhl-model";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, RefreshCw, Shield, TrendingUp, Trophy } from "lucide-react";
import { buildSnapshots, fetchSeasonGames, type SeasonSnapshot } from "@/lib/rankings";

const CURRENT_SEASON = currentNflSeason();

export default function SportsHub({ initial, initialHockey, initialBaseball }: { initial: Awaited<ReturnType<typeof import("@/lib/build-snapshot").buildNflSnapshot>>; initialHockey: HockeySnapshot; initialBaseball: BaseballSnapshot }) {
  const [snapshot, setSnapshot] = useState<SeasonSnapshot | null>(initial.snapshots.at(-1) ?? null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(() => new Date(initial.updatedAt));
  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseball, setBaseball] = useState(initialBaseball);
  useEffect(() => {
    const loadBaseball = async () => {
      try { const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/data/mlb/current.json`, { cache: "no-store" }); if (response.ok) setBaseball(validateBaseballSnapshot(await response.json())); } catch { /* Retain the last successful snapshot. */ }
    };
    void loadBaseball(); const timer = window.setInterval(loadBaseball, 5 * 60 * 1000); return () => window.clearInterval(timer);
  }, []);
  const [hockey, setHockey] = useState<HockeySnapshot | null>(initialHockey);
  useEffect(() => {
    const loadHockey = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/data/nhl/current.json`, { cache: "no-store" });
        if (response.ok) setHockey(await response.json() as HockeySnapshot);
      } catch { /* The NHL page exposes retry controls if stored data cannot be loaded. */ }
    };
    void loadHockey();
    const timer = window.setInterval(loadHockey, 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const snapshots = buildSnapshots(await fetchSeasonGames(CURRENT_SEASON));
      setSnapshot(snapshots.at(-1) ?? null);
      setUpdatedAt(await snapshotUpdatedAt(CURRENT_SEASON));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Stored NFL data could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load(true), 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [load]);

  const pulse = useMemo(() => {
    const teams = snapshot?.teams ?? [];
    return {
      mover: [...teams].sort((a, b) => b.movement - a.movement)[0],
      offense: [...teams].sort((a, b) => b.components.offense - a.components.offense)[0],
      defense: [...teams].sort((a, b) => b.components.defense - a.components.defense)[0],
    };
  }, [snapshot]);

  const playedHockey = hockey?.teams.filter(t=>t.gamesPlayed>0) ?? [];
  const nhlScoring = [...playedHockey].sort((a,b)=>b.goalsFor/b.gamesPlayed-a.goalsFor/a.gamesPlayed)[0];
  const nhlDefense = [...playedHockey].sort((a,b)=>a.goalsAgainst/a.gamesPlayed-b.goalsAgainst/b.gamesPlayed)[0];
  const playedBaseball = baseball.teams.filter(t=>t.gamesPlayed>0);
  const highestAverage = Math.max(...playedBaseball.map(t=>t.battingAverage));
  const lowestEra = Math.min(...playedBaseball.map(t=>t.era));
  const mlbHitting = playedBaseball.filter(t=>t.battingAverage===highestAverage);
  const mlbPitching = playedBaseball.filter(t=>t.era===lowestEra);

  return (
    <main className="hub-page">
      <header className="site-header">
        <a className="brand" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/`} aria-label="Jay's League Pulse home"><img className="brand-mark" src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/jays-logo.png`} alt="Jay's League Pulse cartoon logo" width="52" height="52" /><span><b>Jay's League Pulse</b><small>STANDINGS · STANDOUTS · STATS</small></span></a>
<div className="header-status"><span className="live-dot" /> Hourly snapshot<span className="divider" />{updatedAt ? `Updated ${updatedAt.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" })} ET` : "Loading"}</div>
      </header>

      <section className="hub-hero">
        <div><p className="eyebrow">Standings, standouts, and the numbers behind every league</p><h1>Jay’s League Pulse.<br /><em>Every league. In focus.</em></h1><p className="hub-intro">Explore the <a href="#nfl-board">NFL snapshot</a>, <a href="#nhl-board">NHL snapshot</a>, <a href="#mlb-board">MLB regular season</a>, and <a href="#nba-board">NBA preview</a>. See what’s happening around each league—standouts, team performance, and regular-season results from the latest snapshots.</p></div>
        <div className="hub-live-mark"><span>CURRENT SNAPSHOT</span><b>4</b><small>LEAGUES TRACKED</small></div>
      </section>

      {error ? <div className="hub-alert"><span>Live NFL data is temporarily unavailable. Open the NFL dashboard to retry.</span><button onClick={() => load()}><RefreshCw />Retry</button></div> : null}

      <section className="league-pulse" id="nfl-board">
        <div className="pulse-heading"><div><p className="eyebrow">Around the NFL</p><h2>Current league pulse</h2></div><a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/nfl/`}>Full dashboard <ArrowRight /></a></div>
        <div className="pulse-grid">
          <article><span><TrendingUp />Biggest mover</span><strong>{pulse.mover ? `${pulse.mover.movement > 0 ? "+" : ""}${pulse.mover.movement}` : "—"}</strong><b>{pulse.mover?.name ?? "Updating"}</b><small>spots since last week</small></article>
          <article><span><Activity />Best offense</span><strong>{pulse.offense?.components.offense.toFixed(1) ?? "—"}</strong><b>{pulse.offense?.name ?? "Updating"}</b><small>offensive grade</small></article>
          <article><span><Shield />Best defense</span><strong>{pulse.defense?.components.defense.toFixed(1) ?? "—"}</strong><b>{pulse.defense?.name ?? "Updating"}</b><small>defensive grade</small></article>
          <article><span><Trophy />Games counted</span><strong>{snapshot?.completedGames ?? "—"}</strong><b>Through Week {snapshot?.week ?? "—"}</b><small>completed NFL games</small></article>
        </div>
      </section>

      <section className="league-pulse" id="nhl-board">
        <div className="pulse-heading"><div><p className="eyebrow">Around the NHL</p><h2>Current league pulse</h2></div><a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/nhl/`}>Full dashboard <ArrowRight /></a></div>
        <div className="pulse-grid">
          <article><span><Activity />Best scoring</span><strong>{nhlScoring ? (nhlScoring.goalsFor/nhlScoring.gamesPlayed).toFixed(2) : "—"}</strong><b>{nhlScoring?.name ?? "No games yet"}</b><small>goals per game</small></article>
          <article><span><Shield />Best defense</span><strong>{nhlDefense ? (nhlDefense.goalsAgainst/nhlDefense.gamesPlayed).toFixed(2) : "—"}</strong><b>{nhlDefense?.name ?? "No games yet"}</b><small>goals allowed per game</small></article>
          <article><span><Trophy />Skater MVP</span><strong>{hockey?.mvps?.first[0]?.stats.find(s=>s.label==="Points")?.value ?? "—"}</strong><b>{hockey?.mvps?.first.map(p=>p.name).join(" / ") || "Building the sample"}</b><small>points · statistical pick</small></article>
          <article><span><Trophy />Games counted</span><strong>{hockey?.completedGames ?? "—"}</strong><b>{hockey ? `${String(hockey.season).slice(0,4)}–${String(hockey.season).slice(6)}` : "Current season"}</b><small>regular-season finals</small></article>
        </div>
      </section>
      <section className="league-pulse" id="mlb-board">
        <div className="pulse-heading"><div><p className="eyebrow">Around MLB</p><h2>{baseball.seasonComplete ? "Regular-season pulse" : "Current league pulse"}</h2></div><a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/mlb/`}>Full dashboard <ArrowRight /></a></div>
        <div className="pulse-grid">
          <article><span><Activity />Best hitting</span><strong>{mlbHitting[0]?.battingAverage.toFixed(3).replace(/^0/,"") ?? "—"}</strong><b>{mlbHitting.map(t=>t.name).join(" / ") || "No games yet"}</b><small>team batting average</small></article>
          <article><span><Shield />Best pitching</span><strong>{mlbPitching[0]?.era.toFixed(2) ?? "—"}</strong><b>{mlbPitching.map(t=>t.name).join(" / ") || "No games yet"}</b><small>team ERA</small></article>
          <article><span><TrendingUp />Home runs</span><strong>{baseball.totalHomeRuns.toLocaleString("en-US")}</strong><b>All 30 teams</b><small>regular-season total</small></article>
          <article><span><Trophy />Games counted</span><strong>{baseball.completedGames.toLocaleString("en-US")}</strong><b>{baseball.season} regular season</b><small>{baseball.seasonComplete ? "completed season" : "completed games"}</small></article>
        </div>
      </section>
      <section className="league-pulse" id="nba-board">
        <div className="pulse-heading"><div><p className="eyebrow">Around the NBA</p><h2>Coming this season</h2></div><span className="hub-pending">Dashboard coming soon</span></div>
        <div className="pulse-grid">
          <article><span><Activity />League status</span><strong>NBA</strong><b>Preparing the dashboard</b><small>regular season only</small></article>
          <article><span><Trophy />Minimum sample</span><strong>5</strong><b>Games per team</b><small>rankings activation threshold</small></article>
          <article><span><Shield />Team performance</span><strong>—</strong><b>Waiting for season data</b><small>offense and defense</small></article>
          <article><span><TrendingUp />League standouts</span><strong>—</strong><b>Waiting for season data</b><small>player leaders</small></article>
        </div>
      </section>

      <footer><span>Unofficial league analysis using ESPN, NHL and MLB data. Regular season only.</span><span>New sports join the board as their seasons begin.</span></footer>
    </main>
  );
}
