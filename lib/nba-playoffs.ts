import type { BasketballTeam } from "./nba-model";
export type NbaPlayoffSlot = { seed:number; team?:BasketballTeam; label:string };
export function basketballPlayoffPicture(teams:BasketballTeam[]) {
  if(teams.length!==30 || new Set(teams.map(t=>t.id)).size!==30) throw new Error("Incomplete NBA playoff standings");
  return ["Eastern Conference","Western Conference"].map(conference=>{
    const rows=teams.filter(t=>t.conference===conference).sort((a,b)=>a.conferenceRank-b.conferenceRank);
    if(rows.length!==15 || rows.some((t,i)=>t.conferenceRank!==i+1)) throw new Error("Invalid NBA conference order");
    const slot=(seed:number):NbaPlayoffSlot=>seed<=6?{seed,team:rows[seed-1],label:rows[seed-1].name}:{seed,label:seed===7?"Winner of 7 vs. 8":"Winner of final play-in game"};
    return {
      conference, direct:rows.slice(0,6), playIn:rows.slice(6,10), outside:rows.slice(10),
      playInGames:[{home:rows[6],away:rows[7],label:"For the No. 7 seed",outcome:"Winner takes seed 7. Loser moves to the final play-in game."},
        {home:rows[8],away:rows[9],label:"Elimination game",outcome:"Winner moves to the final play-in game. Loser is out."}],
      firstRound:([ [1,8],[4,5],[2,7],[3,6] ] as const).map(([home,away])=>({home:slot(home),away:slot(away)})),
    };
  });
}
