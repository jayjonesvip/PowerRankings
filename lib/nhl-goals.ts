import type { HockeyTeam } from "./nhl-model";
export function hockeyGoalBreakdown(teams: HockeyTeam[]) {
  const totals={total:0,powerPlay:0,shorthanded:0,other:0};
  for(const team of teams) {
    if(!Array.isArray(team.players)) throw new Error("Missing goal situation data");
    for(const p of team.players) {
      if(![p.goals,p.powerPlayGoals,p.shorthandedGoals].every(n=>Number.isInteger(n)&&n!>=0) || p.powerPlayGoals!+p.shorthandedGoals!>p.goals) throw new Error("Invalid goal situation totals");
      totals.total+=p.goals;totals.powerPlay+=p.powerPlayGoals!;totals.shorthanded+=p.shorthandedGoals!;
    }
  }
  totals.other=totals.total-totals.powerPlay-totals.shorthanded;
  return totals;
}
