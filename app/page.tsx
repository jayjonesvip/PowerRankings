"use client";

import { snapshotUpdatedAt } from "@/lib/local-data";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, RefreshCw, Shield, TrendingUp, Trophy } from "lucide-react";
import { buildSnapshots, fetchSeasonGames, type SeasonSnapshot } from "@/lib/rankings";

const CURRENT_SEASON = new Date().getFullYear();

export default function SportsHub() {
  const [snapshot, setSnapshot] = useState<SeasonSnapshot | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      leader: teams[0],
      mover: [...teams].sort((a, b) => b.movement - a.movement)[0],
      offense: [...teams].sort((a, b) => b.components.offense - a.components.offense)[0],
      defense: [...teams].sort((a, b) => b.components.defense - a.components.defense)[0],
    };
  }, [snapshot]);

  return (
    <main className="hub-page">
      <header className="site-header">
        <a className="brand" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/`} aria-label="Jay's Power Rankings home"><img className="brand-mark" src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/jays-logo.png`} alt="Jay's Power Rankings cartoon logo" width="52" height="52" /><span><b>Jay's Power Rankings</b><small>THE SPORTS BOARD</small></span></a>
        <div className="header-status"><span className="live-dot" /> Hourly snapshot<span className="divider" />{updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Loading"}</div>
      </header>

      <section className="hub-hero">
        <div><p className="eyebrow">Jay's sports command center</p><h1>Every league.<br /><em>One honest board.</em></h1><p>Current leaders, major movers and data-driven rankings—built from what teams actually do and who they do it against.</p></div>
        <div className="hub-live-mark"><span>LIVE BOARD</span><b>{snapshot?.teams.length ?? "—"}</b><small>NFL TEAMS RANKED</small></div>
      </section>

      {error ? <div className="hub-alert"><span>Live NFL data is temporarily unavailable. Open the rankings to retry.</span><button onClick={() => load()}><RefreshCw />Retry</button></div> : null}

      <section className="sports-board" aria-label="Sports rankings">
        <a className="sport-card nfl-card" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/nfl/`}>
          <div className="sport-card-top"><span className="sport-status"><i />Live rankings</span><b>NFL</b></div>
          <div className="sport-card-main">
            <p>Week {snapshot?.week ?? "—"} · {CURRENT_SEASON}</p>
            <h2>{loading && !snapshot ? "Updating the board…" : pulse.leader ? <>#1 {pulse.leader.name}</> : "Season board"}</h2>
            {pulse.leader ? <span>{pulse.leader.wins}–{pulse.leader.losses}{pulse.leader.ties ? `–${pulse.leader.ties}` : ""} record · {pulse.leader.score.toFixed(1)} index</span> : <span>Rankings update after every final.</span>}
          </div>
          <div className="sport-card-action">Open all 32 rankings <ArrowRight /></div>
        </a>

        <article className="sport-card nba-card">
          <div className="sport-card-top"><span className="sport-status pending">Next league</span><b>NBA</b></div>
          <div className="sport-card-main"><p>Coming this season</p><h2>NBA Power Rankings</h2><span>The board activates after teams have played enough games for opponent quality and scoring efficiency to mean something.</span></div>
          <div className="sport-card-action muted">Launching after five games per team</div>
        </article>
      </section>

      <section className="league-pulse">
        <div className="pulse-heading"><div><p className="eyebrow">Around the NFL</p><h2>Current league pulse</h2></div><a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/nfl/`}>Full dashboard <ArrowRight /></a></div>
        <div className="pulse-grid">
          <article><span><TrendingUp />Biggest mover</span><strong>{pulse.mover ? `${pulse.mover.movement > 0 ? "+" : ""}${pulse.mover.movement}` : "—"}</strong><b>{pulse.mover?.name ?? "Updating"}</b><small>spots since last week</small></article>
          <article><span><Activity />Best offense</span><strong>{pulse.offense?.components.offense.toFixed(1) ?? "—"}</strong><b>{pulse.offense?.name ?? "Updating"}</b><small>offensive grade</small></article>
          <article><span><Shield />Best defense</span><strong>{pulse.defense?.components.defense.toFixed(1) ?? "—"}</strong><b>{pulse.defense?.name ?? "Updating"}</b><small>defensive grade</small></article>
          <article><span><Trophy />Games counted</span><strong>{snapshot?.completedGames ?? "—"}</strong><b>Through Week {snapshot?.week ?? "—"}</b><small>completed NFL games</small></article>
        </div>
      </section>

      <footer><span>Unofficial rankings powered by publicly available ESPN scoreboard data.</span><span>New sports join the board as their seasons begin.</span></footer>
    </main>
  );
}
