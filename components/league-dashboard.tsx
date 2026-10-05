"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, Bolt, Crosshair, Route, Sparkles } from "lucide-react";
import type { DashboardData, DistanceRecord, GameMetric } from "@/lib/dashboard-types";
import { fetchDashboardData } from "@/lib/dashboard-data";

function format(value: number, decimals = 1) {
  return value.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function gameValue(metric: GameMetric | null) {
  return metric ? `${metric.matchup} · ${metric.score}` : "—";
}

function SeasonCard({ label, value, team, detail }: { label: string; value: string; team: string; detail: string }) {
  return <article><span>{label}</span><strong>{value}</strong><b>{team}</b><small>{detail}</small></article>;
}

function RecordLine({ label, season }: { label: string; season: DistanceRecord }) {
  const value = (record: DistanceRecord) => record ? <><b>{record.yards} yards</b><span>{record.player} · {record.team} vs {record.opponent}</span></> : <><b>—</b><span>No qualifying play</span></>;
  return <div className="record-line"><strong>{label}</strong><div><small>Season</small>{value(season)}</div></div>;
}

function TouchdownDonut({ touchdowns }: { touchdowns: DashboardData["seasonStats"]["touchdowns"] }) {
  const slices = [{label:"Receiving",value:touchdowns.receiving,color:"#005a9c"},{label:"Rushing",value:touchdowns.rushing,color:"#d50032"},{label:"Defensive",value:touchdowns.defensive,color:"#377ea6"},{label:"Special teams",value:touchdowns.specialTeams,color:"#041e42"}];
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let offset = 0;
  return <section className="league-pulse" id="touchdown-types"><div className="pulse-heading"><div><p className="eyebrow">How the league scores</p><h2>Touchdown types</h2></div><span>Regular season only</span></div>
    <div className="nhl-goals-layout"><svg viewBox="0 0 200 200" className="nhl-goals-donut" role="img" aria-label={`${total} total touchdowns: ${slices.map(slice => `${slice.value} ${slice.label.toLowerCase()}`).join(", ")}`}><circle cx="100" cy="100" r="76" fill="none" stroke="#edf2f7" strokeWidth="24" />{slices.map(slice => {
      const length = total ? slice.value / total * 100 : 0, start = offset; offset += length;
      return <circle key={slice.label} cx="100" cy="100" r="76" fill="none" stroke={slice.color} strokeWidth="24" pathLength="100" strokeDasharray={`${length} ${100-length}`} strokeDashoffset={-start} transform="rotate(-90 100 100)" />;
    })}<text x="100" y="100" textAnchor="middle" className="nhl-donut-total">{total}</text><text x="100" y="121" textAnchor="middle" className="nhl-donut-label">TOTAL TOUCHDOWNS</text></svg><dl className="nhl-goals-legend">{slices.map(slice => <div key={slice.label}><dt><span style={{background:slice.color}} />{slice.label}</dt><dd><b>{slice.value}</b><small>{total ? (slice.value / total * 100).toFixed(1) : "0.0"}%</small></dd></div>)}</dl></div>
    <p className="mlb-method">Regular-season touchdowns from the stored league snapshot. Receiving touchdowns count passing scores once.</p>
  </section>;
}

function DashboardContent({ data }: { data: DashboardData }) {
  const season = data.seasonStats;
  return (
    <>
      <section id="league-stats" className="league-pulse nfl-season-pulse"><div className="pulse-heading">
        <div><p className="eyebrow">Around the NFL</p><h2>Current season by the numbers</h2></div>
        <span>{season.games} completed games</span>
      </div>

      <div className="pulse-grid">
        <SeasonCard label="Most points" value={season.mostPoints ? format(season.mostPoints.value, 0) : "—"} team={season.mostPoints?.team ?? "Awaiting data"} detail="Team total" />
        <SeasonCard label="Average team score" value={format(season.averageTeamScore)} team="League-wide" detail="Points per team per game" />
        <SeasonCard label="Best scoring average" value={season.bestScoringAverage ? format(season.bestScoringAverage.value) : "—"} team={season.bestScoringAverage?.team ?? "Awaiting data"} detail="Points per game" />
        <SeasonCard label="Best defense" value={season.bestDefenseAverage ? format(season.bestDefenseAverage.value) : "—"} team={season.bestDefenseAverage?.team ?? "Awaiting data"} detail="Fewest points allowed per game" />
        <SeasonCard label="Average game score" value={format(season.averageGameScore)} team="Combined points" detail="Both teams per game" />
        <SeasonCard label="Most touchdowns" value={season.mostTouchdowns ? format(season.mostTouchdowns.value, 0) : "—"} team={season.mostTouchdowns?.team ?? "Awaiting data"} detail="Team total" />
      </div>

      </section>
      <TouchdownDonut touchdowns={season.touchdowns} />
      <div className="scoring-foot"><span><b>{season.fieldGoals}</b> field goals this season</span><span><b>{season.safeties}</b> safeties</span></div>
      <div className="dashboard-panels">
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

export function LeagueDashboard({ season, week, refreshToken, initialData }: { season: number; week: number; refreshToken: number; initialData?: DashboardData }) {
  const [data, setData] = useState<DashboardData | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
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
