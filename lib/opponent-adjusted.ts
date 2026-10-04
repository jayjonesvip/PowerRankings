export type ScoredGame = { id: string; homeId: string; awayId: string; homeScore: number; awayScore: number };
export type AdjustedPerformance = { offense: number | null; defense: number | null; qualifyingGames: number; totalGames: number };
type Log = { gameId: string; opponentId: string; scored: number; allowed: number };

// Equal weight per qualifying game; the game under evaluation cannot influence its baseline.
export function opponentAdjustedPerformance(games: ScoredGame[]): Map<string, AdjustedPerformance> {
  const logs = new Map<string, Log[]>();
  for (const game of games) {
    for (const [id, opponentId, scored, allowed] of [
      [game.homeId, game.awayId, game.homeScore, game.awayScore],
      [game.awayId, game.homeId, game.awayScore, game.homeScore],
    ] as const) {
      logs.set(id, [...(logs.get(id) ?? []), { gameId: game.id, opponentId, scored, allowed }]);
    }
  }
  return new Map([...logs].map(([id, log]) => {
    const comparisons = log.flatMap(game => {
      const others = (logs.get(game.opponentId) ?? []).filter(other => other.gameId !== game.gameId);
      if (others.length < 2) return [];
      const scoringBaseline = others.reduce((sum, other) => sum + other.scored, 0) / others.length;
      const allowedBaseline = others.reduce((sum, other) => sum + other.allowed, 0) / others.length;
      return [{ offense: game.scored - allowedBaseline, defense: scoringBaseline - game.allowed }];
    });
    return [id, {
      offense: comparisons.length ? comparisons.reduce((sum, game) => sum + game.offense, 0) / comparisons.length : null,
      defense: comparisons.length ? comparisons.reduce((sum, game) => sum + game.defense, 0) / comparisons.length : null,
      qualifyingGames: comparisons.length, totalGames: log.length,
    }];
  }));
}

export function hockeyScoredGames(games: Array<{ id: string; homeId: string; awayId: string; completed: boolean; homeScore: number | null; awayScore: number | null; decision: string | null }>): ScoredGame[] {
  return games.filter(game => game.completed && game.homeScore !== null && game.awayScore !== null).map(game => {
    const homeScore = game.homeScore!, awayScore = game.awayScore!;
    // The extra shootout standings goal is not a goal scored in play.
    return { id: game.id, homeId: game.homeId, awayId: game.awayId,
      homeScore: homeScore - (game.decision === "SO" && homeScore > awayScore ? 1 : 0),
      awayScore: awayScore - (game.decision === "SO" && awayScore > homeScore ? 1 : 0) };
  });
}
