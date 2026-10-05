// A season changes only after its first completed regular-season game.
export function shouldRetainSeason(previous, season, completedGames) {
  return Boolean(previous && previous.completedGames > 0 && ((previous.seasonComplete && season === previous.season && completedGames === previous.completedGames) || season < previous.season || (season > previous.season && completedGames === 0)));
}
export function latestPlayedSeason(manifests) {
  const played=manifests.filter(m=>Number.isInteger(m.season)&&m.completed>0).sort((a,b)=>b.season-a.season);
  if(!played.length) throw new Error("No completed regular-season sample available");
  return played[0];
}
