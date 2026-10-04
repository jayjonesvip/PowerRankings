import { Crown, Info, ShieldCheck } from "lucide-react";
import { buildPlayoffPicture, type PlayoffSeed } from "@/lib/playoffs";
import type { Game, RankedTeam } from "@/lib/rankings";

function TeamTile({ team }: { team: PlayoffSeed }) {
  return (
    <div className="playoff-team">
      <span className="playoff-seed">{team.seed}</span>
      <span className="team-abbreviation" style={{ color: `#${team.color}` }}>{team.abbreviation}</span>
      <span><b>{team.name}</b><small>{team.wins}–{team.losses}{team.ties ? `–${team.ties}` : ""} · {team.divisionWinner ? `${team.division} leader` : "Wild card"}</small></span>
    </div>
  );
}

function ConferenceBracket({ conference, seeds }: { conference: "AFC" | "NFC"; seeds: PlayoffSeed[] }) {
  const matchup = (high: number, low: number) => {
    const home = seeds[high - 1];
    const away = seeds[low - 1];
    return home && away ? <article className="playoff-matchup"><TeamTile team={away} /><span className="at-label">AT</span><TeamTile team={home} /></article> : null;
  };
  return (
    <section className={`conference-bracket ${conference.toLowerCase()}`}>
      <div className="conference-title"><span>{conference}</span><small>Current seeds</small></div>
      {seeds[0] ? <div className="bye-card"><Crown /><div><small>First-round bye</small><TeamTile team={seeds[0]} /></div></div> : null}
      <div className="wild-card-label"><span>Wild Card Round</span><small>Higher seed hosts</small></div>
      <div className="wild-card-stack">{matchup(2, 7)}{matchup(3, 6)}{matchup(4, 5)}</div>
    </section>
  );
}

export function PlayoffBracket({ games, teams, week }: { games: Game[]; teams: RankedTeam[]; week: number }) {
  if (teams.length < 32) return null;
  const picture = buildPlayoffPicture(games, teams, week);
  return (
    <section className="playoff-section" id="playoff-picture">
      <div className="playoff-heading">
        <div><p className="eyebrow">Postseason picture</p><h2>If the playoffs started today</h2></div>
        <span><ShieldCheck /> Through Week {week}</span>
      </div>
      <div className="playoff-brackets">{picture.map((side) => <ConferenceBracket key={side.conference} {...side} />)}</div>
      <div className="playoff-next-round"><span>Divisional Round</span><b>No. 1 hosts the lowest remaining seed</b><i /> <span>Conference Championship</span><b>Highest remaining seed hosts</b></div>
      <p className="playoff-note"><Info /> Seeds follow NFL rules: four division leaders, then three wild cards per conference. Current ties use the available head-to-head, division/conference record, common-games, strength-of-victory and strength-of-schedule data; point differential and Jay’s index resolve ties that remain this early in the season.</p>
    </section>
  );
}
