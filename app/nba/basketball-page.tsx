"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { PlayerLeaders } from "@/components/player-leaders";
import { NbaMvp } from "@/components/nba-mvp";
import { nbaPlayerLeaders } from "@/lib/nba-player-stats";
import { HeaderNavigation } from "@/components/header-navigation";
import { LeagueTabs } from "@/components/league-tabs";
import { WeeklyRankingsLink } from "@/components/weekly-rankings-link";
import { validateBasketballSnapshot, type BasketballSnapshot } from "@/lib/nba-model";
const base=process.env.NEXT_PUBLIC_BASE_PATH||"";
export default function BasketballPage({initialData}:{initialData:BasketballSnapshot}) {
  const [data,setData]=useState(initialData),[view,setView]=useState<"dashboard"|"standings"|"stats">("dashboard");
  const [loading,setLoading]=useState(false),[error,setError]=useState("");
  async function load() {
    setLoading(true);
    try { const response=await fetch(`${base}/data/nba/current.json`,{cache:"no-store"});if(!response.ok)throw new Error(`Stored NBA data unavailable (${response.status}).`);setData(validateBasketballSnapshot(await response.json()));setError(""); }
    catch(reason) { setError(reason instanceof Error?reason.message:"NBA refresh failed."); } finally { setLoading(false); }
  }
  useEffect(()=>{const timer=window.setInterval(load,5*60*1000);return ()=>window.clearInterval(timer);},[]);
  const playerLeaders=data.playerStats ? nbaPlayerLeaders(data.playerStats,data.teams) : null;
  const played=data.teams.filter(t=>t.gamesPlayed>0);
  const leaders=(key:"pointsFor"|"pointsAgainst",ascending=false)=>{
    const values=played.map(t=>t[key]/t.gamesPlayed),best=ascending?Math.min(...values):Math.max(...values);
    return {value:played.length?best.toFixed(1):"—",names:played.filter(t=>t[key]/t.gamesPlayed===best).map(t=>t.name).join(" / ")||"No games yet"};
  };
  const offense=leaders("pointsFor"),defense=leaders("pointsAgainst",true);
  const bestRecord=Math.max(...played.map(t=>t.winPercentage));
  return <main data-sport="nba">
    <header className="site-header"><a className="brand" href={`${base}/`} aria-label="League Snapshot home"><img className="brand-mark" src={`${base}/league-snapshot-logo.png`} alt="League Snapshot logo" width="52" height="52"/><span><b>League Snapshot</b><small>NBA LEAGUE SNAPSHOT</small></span></a><HeaderNavigation><nav className="league-nav" aria-label="Leagues">{["nfl","nhl","mlb","nba"].map(s=><a key={s} href={`${base}/${s}/`} aria-current={s==="nba"?"page":undefined}>{s.toUpperCase()}</a>)}</nav><div className="header-status">Hourly snapshot · {new Date(data.updatedAt).toLocaleString("en-US",{timeZone:"America/New_York",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})} ET</div></HeaderNavigation></header>
    <section className="scoreboard-hero"><div><p className="eyebrow">{data.seasonLabel} · Regular season</p><h1>NBA Snapshot<br/><em>The season by the numbers</em></h1><p>Conference standings, player leaders, and the MVP race.</p></div><div className="hero-score nhl-games-count"><span>FINAL GAMES</span><strong>{data.completedGames}</strong><small>Regular season</small></div></section>
    <WeeklyRankingsLink league="nba"/>
    <LeagueTabs label="NBA sections" view={view} onChange={setView} tabs={[{view:"dashboard",label:"NBA Snapshot"},{view:"standings",label:"Standings"},{view:"stats",label:"Stats"}]}/>
    <div className="controls"><span>{data.seasonLabel} NBA · Regular season</span><div className="control-actions"><button onClick={load} disabled={loading}><RefreshCw size={16} className={loading?"spin":""}/>Refresh</button></div></div>
    {error&&<section className="error-card" role="alert">Showing the last successful snapshot. {error}<button onClick={load}>Try again</button></section>}
    <section id="dashboard-panel" role="tabpanel" aria-labelledby="dashboard-tab" hidden={view!=="dashboard"}><section className="league-pulse" id="league-stats"><div className="pulse-heading"><div><p className="eyebrow">Around the NBA</p><h2>Current season by the numbers</h2></div><span>30 teams</span></div><div className="pulse-grid">
      <article><span>Best scoring</span><strong>{offense.value}</strong><b>{offense.names}</b><small>points per game</small></article>
      <article><span>Best defense</span><strong>{defense.value}</strong><b>{defense.names}</b><small>fewest points allowed per game</small></article>
      <article><span>Best record</span><strong>{played.length?bestRecord.toFixed(3):"—"}</strong><b>{played.filter(t=>t.winPercentage===bestRecord).map(t=>t.name).join(" / ")||"No games yet"}</b><small>win percentage</small></article>
      <article><span>Season progress</span><strong>{data.completedGames.toLocaleString("en-US")}</strong><b>Completed games</b><small>Regular season only</small></article>
    </div></section><p className="controls">{data.rankingsReady?"The five-game sample is ready for Jay’s weekly rankings.":"Weekly rankings activate after every team has five completed games."} Scoring rates are points per game, without pace or opponent adjustment.</p><NbaMvp data={data.playerStats} teams={data.teams}/></section>
    <section id="standings-panel" role="tabpanel" aria-labelledby="standings-tab" hidden={view!=="standings"}><section id="division-standings" className="nba-standings"><h2>Conference standings</h2><p>Conference order and games back follow ESPN. Rankings are a separate weekly column.</p>{["Eastern Conference","Western Conference"].map(conference=><section key={conference}><h3>{conference}</h3><div className="nba-table-scroll"><table><caption className="sr-only">{conference} regular-season standings</caption><thead><tr>{["Position","Team","GP","W","L","PCT","GB","PPG","Opp PPG","Diff / game","L10","Streak"].map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{data.teams.filter(t=>t.conference===conference).sort((a,b)=>a.conferenceRank-b.conferenceRank).map(t=><tr key={t.id}><td>{t.conferenceRank}</td><th scope="row">{t.name}</th><td>{t.gamesPlayed}</td><td>{t.wins}</td><td>{t.losses}</td><td>{t.winPercentage.toFixed(3)}</td><td>{t.gamesBehind||"—"}</td><td>{t.gamesPlayed?(t.pointsFor/t.gamesPlayed).toFixed(1):"—"}</td><td>{t.gamesPlayed?(t.pointsAgainst/t.gamesPlayed).toFixed(1):"—"}</td><td>{t.gamesPlayed?((t.pointsFor-t.pointsAgainst)/t.gamesPlayed).toFixed(1):"—"}</td><td>{t.lastTen}</td><td>{t.streak}</td></tr>)}</tbody></table></div></section>)}</section></section>
    <section id="stats-panel" role="tabpanel" aria-labelledby="stats-tab" hidden={view!=="stats"}>
      <PlayerLeaders id="player-leaders" title="NBA player leaders" categories={[
        {label:"Scoring leaders",rows:playerLeaders?.points??[],detail:"Points per game (PPG)"},
        {label:"Assist leaders",rows:playerLeaders?.assists??[],detail:"Assists per game (APG)"},
        {label:"Rebound leaders",rows:playerLeaders?.rebounds??[],detail:"Rebounds per game (RPG)"},
        {label:"Steal leaders",rows:playerLeaders?.steals??[],detail:"Steals per game (SPG)"},
        {label:"Block leaders",rows:playerLeaders?.blocks??[],detail:"Blocks per game (BPG)"}
      ].map(category=>({...category,format:(value:number)=>value.toFixed(1)}))} note="Regular-season per-game averages from completed box scores. Players need at least two appearances and 70% of team games. Traded players' totals are combined. Exact ties share a rank; alphabetical order determines the five players shown at the cutoff. Displayed averages are rounded to one decimal."/>
    </section>
    <footer>Unofficial NBA analysis using ESPN standings. Regular season only. Scheduled hourly; source updates and GitHub processing can be delayed.</footer>
  </main>;
}
