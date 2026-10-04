"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import { fetchWeekSchedule, type RankedTeam, type ScheduledGame } from "@/lib/rankings";

type Prediction = {
  game: ScheduledGame;
  home: RankedTeam;
  away: RankedTeam;
  homePoints: number;
  awayPoints: number;
  favorite: RankedTeam;
  margin: number;
  confidence: "Lean" | "Favorite" | "Strong favorite";
  reason: string;
};

const clamp = (value: number) => Math.max(6, Math.min(45, value));

function predict(game: ScheduledGame, teams: RankedTeam[], leagueAverage: number): Prediction | null {
  const home = teams.find((team) => team.id === game.homeId);
  const away = teams.find((team) => team.id === game.awayId);
  if (!home || !away) return null;
  const homeGames = Math.max(1, home.wins + home.losses + home.ties);
  const awayGames = Math.max(1, away.wins + away.losses + away.ties);
  const homeBase = (home.pointsFor / homeGames) * 0.45 + (away.pointsAgainst / awayGames) * 0.45 + leagueAverage * 0.10;
  const awayBase = (away.pointsFor / awayGames) * 0.45 + (home.pointsAgainst / homeGames) * 0.45 + leagueAverage * 0.10;
  const powerAdjustment = Math.max(-5, Math.min(5, (home.score - away.score) * 0.12));
  const homeField = game.neutralSite ? 0 : 1.5;
  let homePoints = Math.round(clamp(homeBase + (powerAdjustment + homeField) / 2));
  let awayPoints = Math.round(clamp(awayBase - (powerAdjustment + homeField) / 2));
  if (homePoints === awayPoints) {
    if (home.score + homeField >= away.score) homePoints += 1;
    else awayPoints += 1;
  }
  const favorite = homePoints > awayPoints ? home : away;
  const underdog = favorite.id === home.id ? away : home;
  const margin = Math.abs(homePoints - awayPoints);
  const confidence = margin >= 7 ? "Strong favorite" : margin >= 3 ? "Favorite" : "Lean";
  const indexDifference = favorite.score - underdog.score;
  const roadNote = favorite.id === away.id && !game.neutralSite ? " despite playing on the road" : "";
  const reason = indexDifference >= 0
    ? `${favorite.abbreviation} is ranked #${favorite.rank} with a ${indexDifference.toFixed(1)}-point index edge${roadNote}.`
    : `${favorite.abbreviation}'s scoring matchup${favorite.id === home.id && !game.neutralSite ? " and home field" : ""} overcome a ${Math.abs(indexDifference).toFixed(1)}-point index deficit.`;
  return { game, home, away, homePoints, awayPoints, favorite, margin, confidence, reason };
}

export function GameForecast({ season, throughWeek, teams }: { season: number; throughWeek: number; teams: RankedTeam[] }) {
  const forecastWeek = throughWeek + 1;
  const [games, setGames] = useState<ScheduledGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchWeekSchedule(season, forecastWeek, controller.signal)
      .then(setGames)
      .catch((reason) => { if (reason instanceof Error && reason.name !== "AbortError") setError(reason.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [season, forecastWeek]);

  const predictions = useMemo(() => {
    const totalGames = teams.reduce((sum, team) => sum + team.wins + team.losses + team.ties, 0);
    const leagueAverage = totalGames ? teams.reduce((sum, team) => sum + team.pointsFor, 0) / totalGames : 21;
    return games.map((game) => predict(game, teams, leagueAverage)).filter((item): item is Prediction => Boolean(item));
  }, [games, teams]);

  if (forecastWeek > 18) return null;
  return (
    <section className="forecast-section" aria-labelledby="forecast-title">
      <div className="forecast-heading">
        <div><p className="eyebrow">Jay's model predictions</p><h2 id="forecast-title">Week {forecastWeek} Forecast</h2></div>
        <span><Sparkles />Projected from rankings through Week {throughWeek}</span>
      </div>
      {loading ? <div className="forecast-loading">Building next week’s forecast…</div> : null}
      {error ? <div className="forecast-error">Forecast unavailable: {error}</div> : null}
      {!loading && !error && !predictions.length ? <div className="forecast-empty">No games are scheduled for Week {forecastWeek}.</div> : null}
      {predictions.length ? <div className="forecast-grid">{predictions.map((prediction) => (
        <article className="forecast-card" key={prediction.game.id}>
          <div className="forecast-meta"><span><CalendarDays />{new Date(prediction.game.date).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>{prediction.game.neutralSite ? <span><MapPin />Neutral site</span> : null}</div>
          <div className="forecast-matchup">
            <div><small>#{prediction.away.rank}</small><b>{prediction.away.abbreviation}</b><strong>{prediction.awayPoints}</strong></div>
            <span>{prediction.game.neutralSite ? "VS" : "AT"}</span>
            <div><small>#{prediction.home.rank}</small><b>{prediction.home.abbreviation}</b><strong>{prediction.homePoints}</strong></div>
          </div>
          <div className="forecast-call"><span>{prediction.confidence}</span><b>{prediction.favorite.name} by {prediction.margin}</b><small>{prediction.reason}</small></div>
        </article>
      ))}</div> : null}
      <p className="forecast-disclaimer">Model forecast only—not a sportsbook line. Scores blend scoring averages, opponent defense, power index and home field.</p>
    </section>
  );
}
