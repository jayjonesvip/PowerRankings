import type { Game, RankedTeam } from "@/lib/rankings";
import type { HockeyTeam } from "@/lib/nhl-model";
import { buildDivisionStandings } from "@/lib/playoffs";

export function NflDivisionStandings({ games, teams, week }: { games: Game[]; teams: RankedTeam[]; week: number }) {
  const conferences = buildDivisionStandings(games, teams, week);
  return <section className="division-standings" id="division-standings" aria-label="NFL division standings">
    <div className="dashboard-heading"><div><p className="eyebrow">Division race</p><h2>Standings by division</h2></div><span>Through Week {week}</span></div>
    {conferences.map(({ conference, divisions }) => <section className="standings-conference" key={conference}>
      <h3>{conference}</h3><div className="division-grid">{divisions.map(({ division, teams }) =>
        <section className="rankings-card" key={division}><div className="section-heading"><h4>{conference} {division}</h4></div>
          <div className="nhl-table-wrap"><table className="nhl-table"><caption className="sr-only">{conference} {division} standings through Week {week}</caption><thead><tr><th scope="col">Team</th><th scope="col">W–L–T</th><th scope="col">PCT</th><th scope="col">PF</th><th scope="col">PA</th><th scope="col">DIFF</th></tr></thead><tbody>{teams.map(t => {
            const played = t.wins + t.losses + t.ties;
            const percentage = played ? ((t.wins + t.ties * .5) / played).toFixed(3).replace(/^0/, "") : "—";
            return <tr key={t.id}><th scope="row"><b>{t.name}</b></th><td>{t.wins}–{t.losses}–{t.ties}</td><td>{percentage}</td><td>{t.pointsFor}</td><td>{t.pointsAgainst}</td><td>{t.pointsFor - t.pointsAgainst}</td></tr>;
          })}</tbody></table></div>
        </section>)}</div>
    </section>)}
  </section>;
}

export function NhlDivisionStandings({ teams }: { teams: HockeyTeam[] }) {
  const conferences = [{ conference: "Eastern", divisions: ["Atlantic", "Metropolitan"] }, { conference: "Western", divisions: ["Central", "Pacific"] }];
  return <section className="division-standings" id="division-standings" aria-label="NHL division standings">
    <div className="dashboard-heading"><div><p className="eyebrow">Division race</p><h2>Standings by division</h2></div><span>W–L–OTL</span></div>
    {conferences.map(({ conference, divisions }) => <section className="standings-conference" key={conference}>
      <h3>{conference} Conference</h3><div className="division-grid">{divisions.map(division => {
        const rows = teams.filter(t => t.conference === conference && t.division === division)
          .sort((a, b) => a.divisionRank && b.divisionRank ? a.divisionRank - b.divisionRank : b.points - a.points || b.regulationWins - a.regulationWins || a.abbreviation.localeCompare(b.abbreviation));
        return <section className="rankings-card" key={division}><div className="section-heading"><h4>{division} Division</h4></div>
          <div className="nhl-table-wrap"><table className="nhl-table"><caption className="sr-only">{conference} {division} standings</caption><thead><tr><th scope="col">Team</th><th scope="col">GP</th><th scope="col">W–L–OTL</th><th scope="col">PTS</th><th scope="col">GF</th><th scope="col">GA</th><th scope="col">DIFF</th></tr></thead><tbody>{rows.map(t => <tr key={t.id}><th scope="row"><b>{t.name}</b></th><td>{t.gamesPlayed}</td><td>{t.wins}–{t.losses}–{t.overtimeLosses}</td><td><b>{t.points}</b></td><td>{t.goalsFor}</td><td>{t.goalsAgainst}</td><td>{t.goalsFor - t.goalsAgainst}</td></tr>)}</tbody></table></div>
        </section>;
      })}</div>
    </section>)}
    <p className="nhl-note">{teams.every(t => Number.isInteger(t.divisionRank)) ? "Division order follows NHL’s published regular-season standings and tiebreakers." : "Within each division: points, regulation wins, then abbreviation. Tied rows do not apply all official playoff tiebreakers."}</p>
  </section>;
}
