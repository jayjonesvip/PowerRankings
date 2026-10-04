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

function CompareCard({ icon, label, weekValue, seasonValue, detail }: { icon: React.ReactNode; label: string; weekValue: string; seasonValue: string; detail: string }) {
  return (
    <article className="compare-card">
      <div className="compare-title"><span>{icon}</span><div><small>{label}</small><b>{detail}</b></div></div>
      <div className="compare-values"><div><small>This week</small><strong>{weekValue}</strong></div><div><small>Season</small><strong>{seasonValue}</strong></div></div>
    </article>
  );
}

function RecordLine({ label, week, season }: { label: string; week: DistanceRecord; season: DistanceRecord }) {
  const value = (record: DistanceRecord) => record ? <><b>{record.yards} yards</b><span>{record.player} · {record.team} vs {record.opponent}</span></> : <><b>—</b><span>No qualifying play</span></>;
  return <div className="record-line"><strong>{label}</strong><div><small>Week</small>{value(week)}</div><div><small>Season</small>{value(season)}</div></div>;
}

function TouchdownCard({ label, week, season, tone }: { label: string; week: number; season: number; tone: string }) {
  return <div className="td-card" style={{ "--td-tone": tone } as React.CSSProperties}><small>{label}</small><strong>{week}</strong><span>week</span><b>{season} season</b></div>;
}

function DashboardContent({ data }: { data: DashboardData }) {
  const week = data.weekStats;
  const season = data.seasonStats;
  return (
    <>
      <div className="dashboard-heading">
        <div><p className="eyebrow">League command center</p><h2>Week {data.week} by the numbers</h2></div>
        <span>{week.games} finals this week · {season.games} season</span>
      </div>

      <div className="compare-grid">
        <CompareCard icon={<Trophy />} label="Most points" detail="Team total" weekValue={teamValue(week.mostPoints)} seasonValue={teamValue(season.mostPoints)} />
        <CompareCard icon={<Gauge />} label="Average team score" detail="League-wide" weekValue={format(week.averageTeamScore)} seasonValue={format(season.averageTeamScore)} />
        <CompareCard icon={<Bolt />} label="Best scoring average" detail="Points per game" weekValue={teamValue(week.bestScoringAverage, 1)} seasonValue={teamValue(season.bestScoringAverage, 1)} />
        <CompareCard icon={<ShieldCheck />} label="Best defense" detail="Fewest allowed/game" weekValue={teamValue(week.bestDefenseAverage, 1)} seasonValue={teamValue(season.bestDefenseAverage, 1)} />
        <CompareCard icon={<Activity />} label="Average game score" detail="Combined points" weekValue={format(week.averageGameScore)} seasonValue={format(season.averageGameScore)} />
        <CompareCard icon={<Goal />} label="Most touchdowns" detail="Team leader" weekValue={teamValue(week.mostTouchdowns)} seasonValue={teamValue(season.mostTouchdowns)} />
      </div>

      <div className="dashboard-panels">
        <section className="data-panel touchdown-panel">
          <div className="panel-title"><div><p className="eyebrow">Scoring DNA</p><h3>Touchdown types</h3></div><Crosshair /></div>
          <div className="td-grid">
            <TouchdownCard label="Receiving" week={week.touchdowns.receiving} season={season.touchdowns.receiving} tone="#005a9c" />
            <TouchdownCard label="Rushing" week={week.touchdowns.rushing} season={season.touchdowns.rushing} tone="#d50032" />
            <TouchdownCard label="Defensive" week={week.touchdowns.defensive} season={season.touchdowns.defensive} tone="#377ea6" />
            <TouchdownCard label="Special teams" week={week.touchdowns.specialTeams} season={season.touchdowns.specialTeams} tone="#041e42" />
          </div>
          <div className="scoring-foot"><span><b>{week.fieldGoals}</b> field goals this week</span><span><b>{season.fieldGoals}</b> this season</span><span><b>{season.safeties}</b> safeties</span></div>
        </section>

        <section className="data-panel records-panel">
          <div className="panel-title"><div><p className="eyebrow">Big-play board</p><h3>Distance records</h3></div><Route /></div>
          <RecordLine label="Longest touchdown" week={week.longestTouchdown} season={season.longestTouchdown} />
          <RecordLine label="Longest field goal" week={week.longestFieldGoal} season={season.longestFieldGoal} />
        </section>
      </div>

      <section className="data-panel game-records">
        <div className="panel-title"><div><p className="eyebrow">Game records</p><h3>Extremes and finishes</h3></div><Sparkles /></div>
        <div className="game-record-grid">
          <div><span><ArrowDownToLine />Highest scoring</span><b>{gameValue(week.highestScoringGame)}</b><small>Week · {week.highestScoringGame?.value ?? 0} combined</small><em>{gameValue(season.highestScoringGame)}</em><small>Season · {season.highestScoringGame?.value ?? 0} combined</small></div>
          <div><span><Bolt />Largest victory</span><b>{gameValue(week.largestVictory)}</b><small>Week · {week.largestVictory?.value ?? 0}-point margin</small><em>{gameValue(season.largestVictory)}</em><small>Season · {season.largestVictory?.value ?? 0}-point margin</small></div>
          <div><span><Crosshair />Closest finish</span><b>{gameValue(week.closestGame)}</b><small>Week · {week.closestGame?.value ?? 0}-point margin</small><em>{gameValue(season.closestGame)}</em><small>Season · {season.closestGame?.value ?? 0}-point margin</small></div>
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
