"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowDownToLine, Bolt, Crosshair, Gauge, Goal, Route, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import type { DashboardData, DistanceRecord, GameMetric, TeamMetric } from "@/lib/dashboard-types";
import { fetchDashboardData } from "@/lib/dashboard-data";

function format(value: number, decimals = 1) {
  return value.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function teamValue(metric: TeamMetric | null, decimals = 0) {
  return metric ? `${metric.abbreviation} · ${format(metric.value, decimals)}` : "—";
}

function gameValue(metric: GameMetric | null) {
  return metric ? `${metric.matchup} · ${metric.score}` : "—";
}

function CompareCard({ icon, label, seasonValue, detail }: { icon: React.ReactNode; label: string; seasonValue: string; detail: string }) {
  return (
    <article className="compare-card">
      <div className="compare-title"><span>{icon}</span><div><small>{label}</small><b>{detail}</b></div></div>
      <div className="compare-values"><div><small>Season</small><strong>{seasonValue}</strong></div></div>
    </article>
  );
}

function RecordLine({ label, season }: { label: string; season: DistanceRecord }) {
  const value = (record: DistanceRecord) => record ? <><b>{record.yards} yards</b><span>{record.player} · {record.team} vs {record.opponent}</span></> : <><b>—</b><span>No qualifying play</span></>;
  return <div className="record-line"><strong>{label}</strong><div><small>Season</small>{value(season)}</div></div>;
}

function TouchdownCard({ label, season, tone }: { label: string; season: number; tone: string }) {
  return <div className="td-card" style={{ "--td-tone": tone } as React.CSSProperties}><small>{label}</small><strong>{season}</strong><span>season to date</span></div>;
}

function DashboardContent({ data }: { data: DashboardData }) {
  const season = data.seasonStats;
  return (
    <>
      <section id="league-stats"><div className="dashboard-heading">
        <div><p className="eyebrow">League command center</p><h2>Current season by the numbers</h2></div>
        <span>{season.games} completed games</span>
      </div>

      <div className="compare-grid">
        <CompareCard icon={<Trophy />} label="Most points" detail="Team total" seasonValue={teamValue(season.mostPoints)} />
        <CompareCard icon={<Gauge />} label="Average team score" detail="League-wide" seasonValue={format(season.averageTeamScore)} />
        <CompareCard icon={<Bolt />} label="Best scoring average" detail="Points per game" seasonValue={teamValue(season.bestScoringAverage, 1)} />
        <CompareCard icon={<ShieldCheck />} label="Best defense" detail="Fewest allowed/game" seasonValue={teamValue(season.bestDefenseAverage, 1)} />
        <CompareCard icon={<Activity />} label="Average game score" detail="Combined points" seasonValue={format(season.averageGameScore)} />
        <CompareCard icon={<Goal />} label="Most touchdowns" detail="Team leader" seasonValue={teamValue(season.mostTouchdowns)} />
      </div>

      </section>
      <div className="dashboard-panels">
        <section className="data-panel touchdown-panel" id="touchdown-types">
          <div className="panel-title"><div><p className="eyebrow">Scoring DNA</p><h3>Touchdown types</h3></div><Crosshair /></div>
          <div className="td-grid">
            <TouchdownCard label="Receiving" season={season.touchdowns.receiving} tone="#005a9c" />
            <TouchdownCard label="Rushing" season={season.touchdowns.rushing} tone="#d50032" />
            <TouchdownCard label="Defensive" season={season.touchdowns.defensive} tone="#377ea6" />
            <TouchdownCard label="Special teams" season={season.touchdowns.specialTeams} tone="#041e42" />
          </div>
          <div className="scoring-foot"><span><b>{season.fieldGoals}</b> field goals this season</span><span><b>{season.safeties}</b> safeties</span></div>
        </section>

        <section className="data-panel records-panel" id="distance-records">
          <div className="panel-title"><div><p className="eyebrow">Big-play board</p><h3>Distance records</h3></div><Route /></div>
          <RecordLine label="Longest touchdown" season={season.longestTouchdown} />
          <RecordLine label="Longest field goal" season={season.longestFieldGoal} />
        </section>
      </div>

      <section className="data-panel game-records" id="game-records">
        <div className="panel-title"><div><p className="eyebrow">Game records</p><h3>Extremes and finishes</h3></div><Sparkles /></div>
        <div className="game-record-grid">
          <div><span><ArrowDownToLine />Highest scoring</span><b>{gameValue(season.highestScoringGame)}</b><small>Season · {season.highestScoringGame?.value ?? 0} combined</small></div>
          <div><span><Bolt />Largest victory</span><b>{gameValue(season.largestVictory)}</b><small>Season · {season.largestVictory?.value ?? 0}-point margin</small></div>
          <div><span><Crosshair />Closest finish</span><b>{gameValue(season.closestGame)}</b><small>Season · {season.closestGame?.value ?? 0}-point margin</small></div>
        </div>
      </section>
    </>
  );
}

export function LeagueDashboard({ season, week, refreshToken }: { season: number; week: number; refreshToken: number }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchDashboardData(season, week, controller.signal)
      .then(setData)
      .catch((reason) => { if (reason instanceof Error && reason.name !== "AbortError") setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [season, week, refreshToken]);

  if (loading && !data) return <div className="dashboard-loading" aria-live="polite">{Array.from({ length: 6 }, (_, index) => <span key={index} />)}</div>;
  if (error && !data) return <div className="dashboard-error"><b>Dashboard unavailable.</b><span>{error}</span></div>;
  if (!data) return null;
  return <div className={loading ? "league-dashboard is-refreshing" : "league-dashboard"}><DashboardContent data={data} />{error ? <div className="refresh-warning">Showing the last update. {error}</div> : null}</div>;
}
