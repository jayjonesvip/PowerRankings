"use client";

import { currentNflSeason, snapshotUpdatedAt } from "@/lib/local-data";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowDown, ArrowUp, BarChart3, ChevronDown, ChevronUp, ListOrdered, RefreshCw, Shield, Swords, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NflDivisionStandings } from "@/components/division-standings";
import { LeagueSectionLinks } from "@/components/league-section-links";
import { NflLeagueMvps } from "@/components/nfl-league-mvps";
import { LeagueDashboard } from "@/components/league-dashboard";
import { NextOpponent, useNextOpponents } from "@/components/next-opponent";
import { PlayoffBracket } from "@/components/playoff-bracket";
import { buildSnapshots, fetchSeasonGames, type Game, type RankedTeam, type SeasonSnapshot } from "@/lib/rankings";

const CURRENT_SEASON = currentNflSeason();
const NFL_SECTIONS = [
  { id: "division-standings", label: "division standings", view: "dashboard" as const },
  { id: "league-mvps", label: "offensive and defensive MVPs", view: "dashboard" as const },
  { id: "league-stats", label: "league stats", view: "dashboard" as const },
  { id: "touchdown-types", label: "touchdown types", view: "dashboard" as const },
  { id: "distance-records", label: "distance records", view: "dashboard" as const },
  { id: "game-records", label: "game records", view: "dashboard" as const },
  { id: "playoff-picture", label: "playoff picture", view: "dashboard" as const },
  { id: "rankings", label: "power rankings", view: "rankings" as const },
];
type ModelContext = { registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> };

function tileAccent(primary: string, alternate: string) {
  const luminance = (hex: string) => {
    const channels = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255).map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const contrast = (a: string, b: string) => {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
  };
  if (contrast(primary, alternate) >= 3) return alternate;
  return contrast(primary, "ffffff") >= contrast(primary, "090d0c") ? "ffffff" : "090d0c";
}

function Movement({ value }: { value: number }) {
  if (value > 0) return <span className="movement up" title={`Up ${value} spot${value === 1 ? "" : "s"}`}><ArrowUp aria-hidden="true" />{value}</span>;
  if (value < 0) return <span className="movement down" title={`Down ${Math.abs(value)} spots`}><ArrowDown aria-hidden="true" />{Math.abs(value)}</span>;
  return <span className="movement even">—</span>;
}

function Meter({ value, tone }: { value: number; tone: string }) {
  return <span className="meter" aria-label={`${value.toFixed(1)} out of 100`}><span style={{ width: `${Math.max(3, value)}%`, background: tone }} /></span>;
}

function TeamDetail({ team }: { team: RankedTeam }) {
  return (
    <div className="team-detail">
      <div className="breakdown">
        <div><span>Record</span><strong>{team.components.record.toFixed(1)}</strong><Meter value={team.components.record} tone="#005a9c" /></div>
        <div><span>Win quality</span><strong>{team.components.quality.toFixed(1)}</strong><Meter value={team.components.quality} tone="#041e42" /></div>
        <div><span>Offense</span><strong>{team.components.offense.toFixed(1)}</strong><Meter value={team.components.offense} tone="#d50032" /></div>
        <div><span>Defense</span><strong>{team.components.defense.toFixed(1)}</strong><Meter value={team.components.defense} tone="#377ea6" /></div>
        <div><span>Recent</span><strong>{team.components.momentum.toFixed(1)}</strong><Meter value={team.components.momentum} tone="#64748b" /></div>
      </div>
      <div className="explanation">
        <p>{team.summary}</p>
        <div className="results-strip">
          {team.recentGames.length ? team.recentGames.map((game) => (
            <span className={game.result === "W" ? "win" : game.result === "L" ? "loss" : "tie"} key={game.id}><b>{game.result}</b> {game.opponent} {game.pointsFor}–{game.pointsAgainst}</span>
          )) : <span>No completed games yet.</span>}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const season = CURRENT_SEASON;
  const [snapshots, setSnapshots] = useState<SeasonSnapshot[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [view, setView] = useState<"rankings" | "dashboard">("dashboard");
  const [dashboardRefresh, setDashboardRefresh] = useState(0);
  const [topFirst, setTopFirst] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async (selectedSeason: number, quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const games = await fetchSeasonGames(selectedSeason);
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

  const snapshot = snapshots.at(-1);
  const week = snapshot?.week ?? 1;
  const nextOpponents = useNextOpponents(season, week, snapshot?.teams ?? [], updatedAt?.toISOString() ?? "");
  const rankings = useMemo(() => {
    const teams = [...(snapshot?.teams ?? [])];
    return topFirst ? teams : teams.reverse();
  }, [snapshot, topFirst]);
  const structuredData = snapshot ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Jay's NFL Power Rankings Week ${week}, ${season}`,
    description: `Data-driven rankings of all 32 NFL teams through Week ${week} of the ${season} season.`,
    numberOfItems: snapshot.teams.length,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    itemListElement: snapshot.teams.map((team) => ({ "@type": "ListItem", position: team.rank, name: team.name })),
  } : null;

  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const report = () => undefined;
    try {
      void Promise.resolve(context.registerTool({
        name: "set_rankings_view",
        title: "Set rankings view",
        description: "Change the current NFL dashboard tab or rankings sort direction.",
        inputSchema: {
          type: "object",
          properties: {
            topFirst: { type: "boolean" },
            view: { type: "string", enum: ["rankings", "dashboard"] },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input: unknown) {
          const values = input as { topFirst?: boolean; view?: "rankings" | "dashboard" };
          if (values.topFirst !== undefined) setTopFirst(values.topFirst);
          if (values.view !== undefined) setView(values.view);
          return { season, week, topFirst: values.topFirst ?? topFirst, view: values.view ?? view };
        },
      }, { signal: lifecycle.signal })).catch(report);
      void Promise.resolve(context.registerTool({
        name: "read_power_rankings",
        title: "Read power rankings",
        description: "Read the currently visible NFL rankings and their index scores.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute() { return { season, week, teams: rankings.map((team) => ({ rank: team.rank, team: team.name, record: `${team.wins}-${team.losses}${team.ties ? `-${team.ties}` : ""}`, score: Number(team.score.toFixed(1)) })) }; },
      }, { signal: lifecycle.signal })).catch(report);
    } catch { report(); }
    return () => lifecycle.abort();
  }, [rankings, season, week, topFirst, view]);

  return (
    <main data-sport="nfl">
      {structuredData ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /> : null}
      <header className="site-header">
        <a className="brand" href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/`} aria-label="Jay's Power Rankings home"><img className="brand-mark" src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/jays-logo.png`} alt="Jay's Power Rankings cartoon logo" width="52" height="52" /><span><b>Jay's Power Rankings</b><small>NFL POWER INDEX</small></span></a>
        <nav className="league-nav" aria-label="Leagues"><a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/nfl/`}>NFL</a><a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/nhl/`}>NHL</a></nav><div className="header-status"><span className="live-dot" /> Hourly snapshot<span className="divider" />{updatedAt ? `Updated ${updatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Loading"}</div>
      </header>

      <section className="scoreboard-hero">
        <div><p className="eyebrow">Updated NFL team rankings</p><h1>Jay's Power Rankings<br /><em>Week {week}, {season}</em></h1><LeagueSectionLinks sections={NFL_SECTIONS} onViewChange={setView} /></div>
        <div className="hero-score"><span>WEEK</span><strong>{String(week).padStart(2, "0")}</strong><small>{snapshot?.completedGames ?? 0} FINAL GAMES</small></div>
      </section>

      <nav className="view-tabs" aria-label="Site sections">
        <button className={view === "dashboard" ? "active" : ""} onClick={() => setView("dashboard")}><BarChart3 />League Dashboard</button>
        <button className={view === "rankings" ? "active" : ""} onClick={() => setView("rankings")}><ListOrdered />Power Rankings</button>
      </nav>

      <section className="controls" aria-label="Current snapshot controls">
        <span>{season} NFL · Current snapshot</span>
        <div className="control-actions">{view === "rankings" ? <Button variant="outline" onClick={() => setTopFirst((value) => !value)}>{topFirst ? <ChevronDown /> : <ChevronUp />}{topFirst ? "Show 32 → 1" : "Show 1 → 32"}</Button> : null}<Button onClick={() => { load(season); }} disabled={loading}><RefreshCw className={loading ? "spin" : ""} />Refresh</Button></div>
      </section>

      {error ? <section className="error-card" role="alert"><strong>Couldn’t reach ESPN.</strong> {error}<Button onClick={() => load(season)}>Try again</Button></section> : null}

      {view === "rankings" ? <><section className="dashboard-grid" id="rankings">
        <div className="rankings-card">
          <div className="section-heading"><div><p className="eyebrow">Best NFL teams this week</p><h2>{season} NFL Power Rankings: All 32 Teams</h2></div><span>{loading ? "Updating…" : `Through Week ${week}`}</span></div>
          {loading && !rankings.length ? <div className="loading-list" aria-live="polite">{Array.from({ length: 5 }, (_, i) => <span key={i} />)}</div> : (
            <>
              <div className="team-list">
                {rankings.map((team) => (
                  <article className="team-card" key={team.id}>
                    <div className="team-card-head">
                      <span className={`rank-number rank-${team.rank}`}>{team.rank}</span>
                      <div className="team-identity">
                        <span className="team-color-tile" style={{ "--team-color": `#${team.color}`, "--team-accent": `#${tileAccent(team.color, team.alternateColor)}` } as React.CSSProperties} aria-hidden="true">{team.abbreviation}</span>
                        <span><h3>#{team.rank} {team.name}</h3><small>{team.abbreviation}</small></span>
                      </div>
                      <div className="team-record"><small>Record</small><b>{team.wins}–{team.losses}{team.ties ? `–${team.ties}` : ""}</b></div>
                      <div className="team-points"><small>PF / PA</small><b><span className="pf">{team.pointsFor.toFixed(0)}</span> / <span className="pa">{team.pointsAgainst.toFixed(0)}</span></b></div>
                      <div className="team-index"><small>Index</small><strong>{team.score.toFixed(1)}</strong></div>
                      <Movement value={team.movement} />
                    </div>
                    <TeamDetail team={team} />
                    <NextOpponent team={team} note={nextOpponents.get(team.id)} />
                  </article>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="method-card">
          <p className="eyebrow">The formula</p><h2>Five signals.<br />One honest score.</h2><p>Each category is graded from 0–100 against the league through the latest completed games.</p>
          <div className="weights">
            <div><span className="weight-icon yellow"><Trophy /></span><span><b>25%</b><small>Overall record</small></span></div>
            <div><span className="weight-icon blue"><Swords /></span><span><b>30%</b><small>Win quality</small></span></div>
            <div><span className="weight-icon orange"><Activity /></span><span><b>20%</b><small>Offense</small></span></div>
            <div><span className="weight-icon teal"><Shield /></span><span><b>20%</b><small>Defense</small></span></div>
            <div><span className="weight-icon purple"><Activity /></span><span><b>5%</b><small>Recent form</small></span></div>
          </div>
          <div className="method-note"><b>No preseason. No double-counting wins.</b><br />Win quality is 80% opponent performance and 20% scoring margin. Beating bottom-ranked teams now earns a low quality score.</div>
        </aside>
      </section></> : <section className="dashboard-view" id="dashboard"><NflDivisionStandings games={games} teams={snapshot?.teams ?? []} week={week} /><NflLeagueMvps season={season} completedGames={snapshot?.completedGames ?? 0} refreshToken={dashboardRefresh} /><LeagueDashboard season={season} week={week} refreshToken={dashboardRefresh} /><PlayoffBracket games={games} teams={snapshot?.teams ?? []} week={week} /></section>}

      <footer><span>Unofficial rankings powered by publicly available ESPN scoreboard data.</span><span>Data syncs hourly; checks for updates every 5 minutes.</span></footer>
    </main>
  );
}
