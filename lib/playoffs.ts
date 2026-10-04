import type { Game, RankedTeam } from "@/lib/rankings";

export type Conference = "AFC" | "NFC";
export type PlayoffSeed = RankedTeam & { seed: number; division: string; divisionWinner: boolean };
export type ConferencePlayoffPicture = { conference: Conference; seeds: PlayoffSeed[] };

const ALIGNMENT: Record<string, { conference: Conference; division: string }> = {
  BUF: { conference: "AFC", division: "East" }, MIA: { conference: "AFC", division: "East" }, NE: { conference: "AFC", division: "East" }, NYJ: { conference: "AFC", division: "East" },
  BAL: { conference: "AFC", division: "North" }, CIN: { conference: "AFC", division: "North" }, CLE: { conference: "AFC", division: "North" }, PIT: { conference: "AFC", division: "North" },
  HOU: { conference: "AFC", division: "South" }, IND: { conference: "AFC", division: "South" }, JAX: { conference: "AFC", division: "South" }, TEN: { conference: "AFC", division: "South" },
  DEN: { conference: "AFC", division: "West" }, KC: { conference: "AFC", division: "West" }, LV: { conference: "AFC", division: "West" }, LAC: { conference: "AFC", division: "West" },
  DAL: { conference: "NFC", division: "East" }, NYG: { conference: "NFC", division: "East" }, PHI: { conference: "NFC", division: "East" }, WSH: { conference: "NFC", division: "East" },
  CHI: { conference: "NFC", division: "North" }, DET: { conference: "NFC", division: "North" }, GB: { conference: "NFC", division: "North" }, MIN: { conference: "NFC", division: "North" },
  ATL: { conference: "NFC", division: "South" }, CAR: { conference: "NFC", division: "South" }, NO: { conference: "NFC", division: "South" }, TB: { conference: "NFC", division: "South" },
  ARI: { conference: "NFC", division: "West" }, LAR: { conference: "NFC", division: "West" }, SF: { conference: "NFC", division: "West" }, SEA: { conference: "NFC", division: "West" },
};

type RecordLine = { wins: number; losses: number; ties: number };
const pct = ({ wins, losses, ties }: RecordLine) => {
  const games = wins + losses + ties;
  return games ? (wins + ties * 0.5) / games : 0;
};

function teamResult(game: Game, teamId: string) {
  const home = game.homeId === teamId;
  const pointsFor = home ? game.homeScore : game.awayScore;
  const pointsAgainst = home ? game.awayScore : game.homeScore;
  return { opponentId: home ? game.awayId : game.homeId, pointsFor, pointsAgainst, result: pointsFor === pointsAgainst ? 0.5 : pointsFor > pointsAgainst ? 1 : 0 };
}

function recordFor(teamId: string, games: Game[], predicate: (opponentId: string) => boolean = () => true): RecordLine {
  const results = games.filter((game) => game.homeId === teamId || game.awayId === teamId).map((game) => teamResult(game, teamId)).filter((row) => predicate(row.opponentId));
  return {
    wins: results.filter((row) => row.result === 1).length,
    losses: results.filter((row) => row.result === 0).length,
    ties: results.filter((row) => row.result === 0.5).length,
  };
}

function compareNumber(a: number, b: number) {
  return Math.abs(a - b) < 0.000001 ? 0 : b - a;
}

function makeComparator(games: Game[], teams: RankedTeam[], conference: Conference, withinDivision: boolean) {
  const byId = new Map(teams.map((team) => [team.id, team]));
  const teamGames = (id: string) => games.filter((game) => game.homeId === id || game.awayId === id);
  const opponentPct = (id: string, winsOnly: boolean) => {
    const opponents = teamGames(id).map((game) => teamResult(game, id)).filter((row) => !winsOnly || row.result === 1).map((row) => byId.get(row.opponentId)).filter(Boolean) as RankedTeam[];
    return opponents.length ? opponents.reduce((sum, team) => sum + pct(team), 0) / opponents.length : 0;
  };
  const headToHead = (a: RankedTeam, b: RankedTeam) => {
    const meetings = games.filter((game) => (game.homeId === a.id && game.awayId === b.id) || (game.homeId === b.id && game.awayId === a.id));
    return meetings.length ? pct(recordFor(a.id, meetings)) - pct(recordFor(b.id, meetings)) : 0;
  };
  const commonPct = (team: RankedTeam, other: RankedTeam) => {
    const opponents = new Set(teamGames(other.id).map((game) => teamResult(game, other.id).opponentId));
    const common = teamGames(team.id).map((game) => teamResult(game, team.id)).filter((row) => opponents.has(row.opponentId));
    return common.length >= 4 ? pct({ wins: common.filter((row) => row.result === 1).length, losses: common.filter((row) => row.result === 0).length, ties: common.filter((row) => row.result === 0.5).length }) : -1;
  };

  return (a: RankedTeam, b: RankedTeam) => {
    let result = compareNumber(pct(a), pct(b));
    if (result) return result;
    result = compareNumber(headToHead(a, b), headToHead(b, a));
    if (result) return result;
    const sameDivision = ALIGNMENT[a.abbreviation]?.division === ALIGNMENT[b.abbreviation]?.division;
    if (withinDivision || sameDivision) {
      const division = ALIGNMENT[a.abbreviation]?.division;
      result = compareNumber(
        pct(recordFor(a.id, games, (id) => ALIGNMENT[byId.get(id)?.abbreviation ?? ""]?.division === division && ALIGNMENT[byId.get(id)?.abbreviation ?? ""]?.conference === conference)),
        pct(recordFor(b.id, games, (id) => ALIGNMENT[byId.get(id)?.abbreviation ?? ""]?.division === division && ALIGNMENT[byId.get(id)?.abbreviation ?? ""]?.conference === conference)),
      );
      if (result) return result;
      const commonA = commonPct(a, b);
      const commonB = commonPct(b, a);
      if (commonA >= 0 && commonB >= 0 && (result = compareNumber(commonA, commonB))) return result;
    } else {
      result = compareNumber(
        pct(recordFor(a.id, games, (id) => ALIGNMENT[byId.get(id)?.abbreviation ?? ""]?.conference === conference)),
        pct(recordFor(b.id, games, (id) => ALIGNMENT[byId.get(id)?.abbreviation ?? ""]?.conference === conference)),
      );
      if (result) return result;
      const commonA = commonPct(a, b);
      const commonB = commonPct(b, a);
      if (commonA >= 0 && commonB >= 0 && (result = compareNumber(commonA, commonB))) return result;
    }
    if (withinDivision || sameDivision) {
      result = compareNumber(
        pct(recordFor(a.id, games, (id) => ALIGNMENT[byId.get(id)?.abbreviation ?? ""]?.conference === conference)),
        pct(recordFor(b.id, games, (id) => ALIGNMENT[byId.get(id)?.abbreviation ?? ""]?.conference === conference)),
      );
      if (result) return result;
    }
    result = compareNumber(opponentPct(a.id, true), opponentPct(b.id, true));
    if (result) return result;
    result = compareNumber(opponentPct(a.id, false), opponentPct(b.id, false));
    if (result) return result;
    result = compareNumber(a.pointsFor - a.pointsAgainst, b.pointsFor - b.pointsAgainst);
    if (result) return result;
    return b.score - a.score;
  };
}

export function buildPlayoffPicture(games: Game[], teams: RankedTeam[], throughWeek: number): ConferencePlayoffPicture[] {
  const eligibleGames = games.filter((game) => game.week <= throughWeek);
  return (["AFC", "NFC"] as Conference[]).map((conference) => {
    const conferenceTeams = teams.filter((team) => ALIGNMENT[team.abbreviation]?.conference === conference);
    const divisionComparator = makeComparator(eligibleGames, conferenceTeams, conference, true);
    const conferenceComparator = makeComparator(eligibleGames, conferenceTeams, conference, false);
    const divisionWinners = ["East", "North", "South", "West"].map((division) => conferenceTeams.filter((team) => ALIGNMENT[team.abbreviation]?.division === division).sort(divisionComparator)[0]).filter(Boolean).sort(conferenceComparator);
    const winnerIds = new Set(divisionWinners.map((team) => team.id));
    const wildCards = conferenceTeams.filter((team) => !winnerIds.has(team.id)).sort(conferenceComparator).slice(0, 3);
    const seeds = [...divisionWinners, ...wildCards].map((team, index) => ({ ...team, seed: index + 1, division: ALIGNMENT[team.abbreviation].division, divisionWinner: index < 4 }));
    return { conference, seeds };
  });
}

const TEAM_NAMES: Record<string, string> = {
  BUF: "Buffalo Bills", MIA: "Miami Dolphins", NE: "New England Patriots", NYJ: "New York Jets",
  BAL: "Baltimore Ravens", CIN: "Cincinnati Bengals", CLE: "Cleveland Browns", PIT: "Pittsburgh Steelers",
  HOU: "Houston Texans", IND: "Indianapolis Colts", JAX: "Jacksonville Jaguars", TEN: "Tennessee Titans",
  DEN: "Denver Broncos", KC: "Kansas City Chiefs", LV: "Las Vegas Raiders", LAC: "Los Angeles Chargers",
  DAL: "Dallas Cowboys", NYG: "New York Giants", PHI: "Philadelphia Eagles", WSH: "Washington Commanders",
  CHI: "Chicago Bears", DET: "Detroit Lions", GB: "Green Bay Packers", MIN: "Minnesota Vikings",
  ATL: "Atlanta Falcons", CAR: "Carolina Panthers", NO: "New Orleans Saints", TB: "Tampa Bay Buccaneers",
  ARI: "Arizona Cardinals", LAR: "Los Angeles Rams", SF: "San Francisco 49ers", SEA: "Seattle Seahawks",
};

export function buildDivisionStandings(games: Game[], teams: RankedTeam[], throughWeek: number) {
  const available = new Map(teams.map(team => [team.abbreviation, team]));
  // Show all divisions even before every team has played its first game.
  const roster: RankedTeam[] = Object.keys(ALIGNMENT).map(abbreviation => available.get(abbreviation) ?? {
    id: abbreviation, name: TEAM_NAMES[abbreviation], abbreviation, color: "34413e", alternateColor: "ffffff",
    rank: 0, previousRank: 0, movement: 0, score: 0, wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0,
    components: { record: 0, quality: 0, offense: 0, defense: 0, momentum: 0 }, summary: "", recentGames: [],
  });
  const eligible = games.filter(game => game.week <= throughWeek);
  return (["AFC", "NFC"] as Conference[]).map(conference => ({
    conference,
    divisions: ["East", "North", "South", "West"].map(division => ({
      division,
      teams: roster.filter(team => ALIGNMENT[team.abbreviation].conference === conference && ALIGNMENT[team.abbreviation].division === division)
        .sort(makeComparator(eligible, roster, conference, true)),
    })),
  }));
}
