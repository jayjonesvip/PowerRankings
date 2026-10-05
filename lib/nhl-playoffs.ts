import type { HockeyTeam } from "./nhl-model";
export function hockeyPlayoffPicture(teams: HockeyTeam[]) {
  return ["Eastern", "Western"].map(conference=>{
    const rows=teams.filter(t=>t.conference===conference);
    if(rows.length!==16 || rows.some(t=>!Number.isInteger(t.divisionRank)||!Number.isInteger(t.conferenceRank)||t.conferenceRank!<1||t.conferenceRank!>16||!Number.isInteger(t.wildCardRank)) || new Set(rows.map(t=>t.conferenceRank)).size!==16) throw new Error("Incomplete published NHL playoff ranks");
    const divisions=[...new Set(rows.map(t=>t.division))];
    if(divisions.length!==2) throw new Error("Incomplete NHL divisions");
    const groups=divisions.map(division=>{
      const group=rows.filter(t=>t.division===division).sort((a,b)=>a.divisionRank!-b.divisionRank!);
      if(group.length!==8 || group.some((t,i)=>t.divisionRank!==i+1)) throw new Error("Invalid published NHL division ranks");
      return group.slice(0,3);
    }).sort((a,b)=>a[0].conferenceRank!-b[0].conferenceRank!);
    const wildCards=rows.filter(t=>t.divisionRank!>3).sort((a,b)=>a.wildCardRank!-b.wildCardRank!).slice(0,2);
    if(wildCards.length!==2 || wildCards.some((t,i)=>t.wildCardRank!==i+1)) throw new Error("Invalid NHL wildcard ranks");
    return {conference,matchups:groups.flatMap((group,i)=>[
      {home:group[0],away:wildCards[i===0 ? 1 : 0],homeLabel:`${group[0].division} 1`,awayLabel:i===0 ? "WC 2" : "WC 1"},
      {home:group[1],away:group[2],homeLabel:`${group[0].division} 2`,awayLabel:`${group[0].division} 3`}
    ])};
  });
}
