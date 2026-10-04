export type TeamMetric = {
  team: string;
  abbreviation: string;
  value: number;
};

export type GameMetric = {
  matchup: string;
  score: string;
  value: number;
  week: number;
};

export type DistanceRecord = {
  player: string;
  team: string;
  opponent: string;
  yards: number;
  week: number;
  description: string;
} | null;

export type ScopeDashboard = {
  games: number;
  averageTeamScore: number;
  averageGameScore: number;
  mostPoints: TeamMetric | null;
  bestScoringAverage: TeamMetric | null;
  bestDefenseAverage: TeamMetric | null;
  mostTouchdowns: TeamMetric | null;
  highestScoringGame: GameMetric | null;
  largestVictory: GameMetric | null;
  closestGame: GameMetric | null;
  touchdowns: {
    receiving: number;
    rushing: number;
    defensive: number;
    specialTeams: number;
  };
  fieldGoals: number;
  safeties: number;
  longestTouchdown: DistanceRecord;
  longestFieldGoal: DistanceRecord;
};

export type DashboardData = {
  season: number;
  week: number;
  generatedAt: string;
  weekStats: ScopeDashboard;
  seasonStats: ScopeDashboard;
};
