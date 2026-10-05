// Published regular-season ranks incorporate MLB's standings tiebreakers.
export function mlbPlayoffSeeds(standings) {
  const rows = standings.records?.flatMap(r => r.teamRecords) ?? [];
  return ["American League", "National League"].flatMap(league => {
    const teams = rows.filter(t => t.team?.league?.name === league);
    if (teams.length !== 15) throw new Error("Incomplete MLB playoff league");
    const champions = teams.filter(t => Number(t.divisionRank) === 1).sort((a,b) => Number(a.leagueRank)-Number(b.leagueRank));
    const wildCards = teams.filter(t => Number(t.divisionRank) !== 1 && Number(t.wildCardRank) <= 3).sort((a,b) => Number(a.wildCardRank)-Number(b.wildCardRank));
    if (champions.length !== 3 || new Set(champions.map(t=>t.team.division.id)).size !== 3 ||
        champions.some(t=>!Number.isInteger(Number(t.leagueRank)) || Number(t.leagueRank)<1) ||
        wildCards.length !== 3 || wildCards.some((t,i)=>Number(t.wildCardRank)!==i+1)) throw new Error("Incomplete MLB opening seeds");
    return [...champions,...wildCards].map((t,i)=>({id:String(t.team.id),league,seed:i+1,divisionWinner:i<3}));
  });
}
