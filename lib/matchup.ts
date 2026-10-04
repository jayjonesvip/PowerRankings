import type { RankedTeam, ScheduledGame } from "./rankings";

export function assessMatchup(game: ScheduledGame, team: RankedTeam, teams: RankedTeam[]) {
  const home = teams.find(t => t.id === game.homeId);
  const away = teams.find(t => t.id === game.awayId);
  if (!home || !away) return null;
  const totalGames = teams.reduce((sum, t) => sum + t.wins + t.losses + t.ties, 0);
  const leagueAverage = totalGames ? teams.reduce((sum, t) => sum + t.pointsFor, 0) / totalGames : 21;
  const homeGames = Math.max(1, home.wins + home.losses + home.ties);
  const awayGames = Math.max(1, away.wins + away.losses + away.ties);
  const homeBase = home.pointsFor / homeGames * .45 + away.pointsAgainst / awayGames * .45 + leagueAverage * .10;
  const awayBase = away.pointsFor / awayGames * .45 + home.pointsAgainst / homeGames * .45 + leagueAverage * .10;
  const powerAdjustment = Math.max(-5, Math.min(5, (home.score - away.score) * .12));
  const homeField = game.neutralSite ? 0 : 1.5;
  const clamp = (value: number) => Math.max(6, Math.min(45, value));
  let homePoints = Math.round(clamp(homeBase + (powerAdjustment + homeField) / 2));
  let awayPoints = Math.round(clamp(awayBase - (powerAdjustment + homeField) / 2));
  if (homePoints === awayPoints) {
    if (home.score + homeField >= away.score) homePoints++; else awayPoints++;
  }
  const atHome = team.id === home.id;
  const opponent = atHome ? away : home;
  const margin = atHome ? homePoints - awayPoints : awayPoints - homePoints;
  const label = margin >= 7 ? "Favorable matchup" : margin >= 3 ? "Winnable matchup" : margin > -3 ? "Close matchup" : margin > -7 ? "Tough matchup" : "Very tough matchup";
  const venue = game.neutralSite ? "Neutral site" : atHome ? "At home" : "On the road";
  const indexEdge = team.score - opponent.score;
  const reason = `${venue}, against the #${opponent.rank} team. ${team.abbreviation} has a ${Math.abs(indexEdge).toFixed(1)}-point index ${indexEdge >= 0 ? "edge" : "deficit"}; scoring averages and opponent defense ${margin > 0 ? "favor" : "favor the opponent over"} ${team.abbreviation}.`;
  return { opponent, margin, label, reason };
}
