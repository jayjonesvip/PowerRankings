import { topPlayers } from "../lib/player-leaders.ts";
const OFFENSE = new Set(["QB", "RB", "WR", "TE"]);
const DEFENSE = new Set(["DE", "DT", "LB", "CB", "S", "DB"]);
const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
const sd = values => Math.sqrt(mean(values.map(v => (v - mean(values)) ** 2)));
const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const REQUIRED = new Set(["passing.completions/passingAttempts", "passing.passingYards", "passing.passingTouchdowns", "passing.interceptions", "rushing.rushingAttempts", "rushing.rushingYards", "rushing.rushingTouchdowns", "receiving.receptions", "receiving.receivingTargets", "receiving.receivingYards", "receiving.receivingTouchdowns", "fumbles.fumblesLost", "defensive.totalTackles", "defensive.sacks", "defensive.passesDefended", "defensive.tacklesForLoss", "defensive.defensiveTouchdowns", "interceptions.interceptions", "interceptions.interceptionTouchdowns", "kicking.fieldGoalsMade/fieldGoalAttempts"]);

export function buildMvpSnapshot({ season, updatedAt, games, rosters }) {
  const positions = new Map();
  for (const roster of rosters) for (const group of roster.athletes ?? []) {
    for (const athlete of group.items ?? []) positions.set(athlete.id, athlete.position?.abbreviation);
  }
  const players = new Map(), teamGames = new Map(), seen = new Set();
  for (const game of games) {
    if (seen.has(game.id)) throw new Error("Duplicate MVP game");
    seen.add(game.id);
    if (game.players?.length !== 2 || new Set(game.players.map(t => t.team?.id)).size !== 2) throw new Error(`Missing player box score: ${game.id}`);
    for (const team of game.players) {
      const tid = team.team.id;
      teamGames.set(tid, (teamGames.get(tid) ?? 0) + 1);
      if (!team.statistics?.some(s => s.name === "passing") && !team.statistics?.some(s => s.name === "receiving")) throw new Error(`Incomplete player statistics: ${game.id}`);
      for (const category of team.statistics ?? []) for (const row of category.athletes ?? []) {
        if (!row.athlete?.id || !Array.isArray(row.stats) || !Array.isArray(category.keys)) throw new Error(`Malformed player statistics: ${game.id}`);
        const id = row.athlete.id, key = `${tid}:${id}`;
        if (!players.has(key)) players.set(key, { id, name: row.athlete.displayName, team: team.team.displayName, abbreviation: team.team.abbreviation, teamId: tid, position: positions.get(id), stats: {}, appearances: new Set() });
        const player = players.get(key);
        player.appearances.add(game.id);
        for (let i = 0; i < category.keys.length; i++) {
          if (REQUIRED.has(`${category.name}.${category.keys[i]}`) && (row.stats[i] == null || String(row.stats[i]).split("/").some(v => v.trim() === "" || !Number.isFinite(Number(v))))) throw new Error(`Missing MVP statistic: ${game.id}`);
          const keys = category.keys[i].split("/"), values = String(row.stats[i] ?? "").split("/");
          keys.forEach((stat, index) => {
            const name = `${category.name}.${stat}`;
            player.stats[name] = (player.stats[name] ?? 0) + number(values[index]);
          });
        }
      }
    }
  }
  const totals = new Map();
  for (const player of players.values()) {
    const total = totals.get(player.id) ?? {id:player.id,name:player.name,teams:new Set(),stats:{}};
    total.teams.add(player.team);
    for(const [key,value] of Object.entries(player.stats)) total.stats[key]=(total.stats[key] ?? 0)+value;
    totals.set(player.id,total);
  }
  const categories={receivingYards:"receiving.receivingYards",rushingYards:"rushing.rushingYards",passingYards:"passing.passingYards",passingTouchdowns:"passing.passingTouchdowns",rushingTouchdowns:"rushing.rushingTouchdowns",receivingTouchdowns:"receiving.receivingTouchdowns",fieldGoals:"kicking.fieldGoalsMade"};
  const leaders=Object.fromEntries(Object.entries(categories).map(([key,stat])=>[key,topPlayers([...totals.values()].map(p=>({id:p.id,name:p.name,team:[...p.teams].join(" / "),value:p.stats[stat] ?? 0})))]));
  const candidates = [];
  for (const player of players.values()) {
    const s = name => player.stats[name] ?? 0, g = teamGames.get(player.teamId), p = player.position;
    const passingYards = s("passing.passingYards"), rushingYards = s("rushing.rushingYards"), receivingYards = s("receiving.receivingYards");
    const passingTouchdowns = s("passing.passingTouchdowns"), touchdowns = s("rushing.rushingTouchdowns") + s("receiving.receivingTouchdowns");
    const interceptionsThrown = s("passing.interceptions"), fumblesLost = s("fumbles.fumblesLost"), attempts = s("passing.passingAttempts"), carries = s("rushing.rushingAttempts"), targets = s("receiving.receivingTargets");
    const tackles = s("defensive.totalTackles"), sacks = s("defensive.sacks"), interceptions = s("interceptions.interceptions"), passesDefended = s("defensive.passesDefended"), tacklesForLoss = s("defensive.tacklesForLoss");
    // The defensive row already includes interception-return TDs.
    const defensiveTouchdowns = Math.max(s("defensive.defensiveTouchdowns"), s("interceptions.interceptionTouchdowns"));
    if (player.appearances.size < 2) continue;
    let production, efficiency, side;
    if (p === "QB" && attempts / g >= 15) {
      production = (.04 * passingYards + .1 * rushingYards + 4 * passingTouchdowns + 6 * touchdowns - 2 * interceptionsThrown - 2 * fumblesLost) / g;
      efficiency = (passingYards + 20 * passingTouchdowns - 45 * interceptionsThrown) / attempts;
      side = "offense";
    } else if (OFFENSE.has(p) && ((p === "RB" && (carries + s("receiving.receptions")) / g >= 8) || (p === "WR" && targets / g >= 3) || (p === "TE" && targets / g >= 2))) {
      production = (.1 * (rushingYards + receivingYards) + 6 * touchdowns - 2 * fumblesLost) / g;
      efficiency = (rushingYards + receivingYards) / (carries + targets || 1);
      side = "offense";
    } else if (DEFENSE.has(p) && (tackles / g >= 3 || (sacks + interceptions + passesDefended) / g >= .5)) {
      production = (tackles + 3 * sacks + 3 * interceptions + passesDefended + 2 * defensiveTouchdowns) / g;
      efficiency = (sacks + interceptions + passesDefended + .5 * tacklesForLoss) / g;
      side = "defense";
    } else continue;
    candidates.push({ id: player.id, name: player.name, team: player.team, abbreviation: player.abbreviation, position: p, side, games: g, production, efficiency, passingYards, rushingYards, receivingYards, passingTouchdowns, touchdowns, interceptionsThrown, sacks, interceptions, tackles, passesDefended, tacklesForLoss, defensiveTouchdowns });
  }
  for (const player of candidates) {
    const peers = candidates.filter(p => p.position === player.position);
    const productionMean = mean(peers.map(p => p.production)), productionSd = sd(peers.map(p => p.production));
    const efficiencyMean = mean(peers.map(p => p.efficiency)), efficiencySd = sd(peers.map(p => p.efficiency));
    player.index = .75 * (player.production - productionMean) / (productionSd || 1) + .25 * (player.efficiency - efficiencyMean) / (efficiencySd || 1);
    player.aboveAveragePercent = Math.round(100 * (player.production / productionMean - 1));
    player.peerCount = peers.length;
    player.averageYardsPerGame = mean(peers.map(p => (p.position === "QB" ? p.passingYards : p.position === "RB" ? p.rushingYards + p.receivingYards : p.receivingYards) / p.games));
    player.averageSacksPerGame = mean(peers.map(p => p.sacks / p.games));
  }
  const winner = side => {
    const player = candidates.filter(p => p.side === side).sort((a, b) => b.index - a.index || a.id.localeCompare(b.id))[0];
    return player ? { ...player, reason: mvpReason(player) } : null;
  };
  return { schemaVersion: 1, season, updatedAt, completedGames: games.length, leaders, offense: winner("offense"), defense: winner("defense"), methodology: "75% production above positional average and 25% efficiency/disruption above positional average. Rates use team games played. At least two appearances and a qualifying workload. Box-score model; excludes offensive linemen and special teams." };
}

export function mvpReason(p) {
  const fmt = n => Number(n.toFixed(1)).toLocaleString("en-US");
  const separation = p.aboveAveragePercent > 0 ? ` His weighted production per game is ${p.aboveAveragePercent}% above the qualifying ${p.position} average.` : " He has the strongest combined production and efficiency score among qualifying players on this side of the ball.";
  if (p.side === "offense") {
    const yards = p.position === "QB" ? p.passingYards : p.position === "RB" ? p.rushingYards + p.receivingYards : p.receivingYards;
    const kind = p.position === "QB" ? "passing" : p.position === "RB" ? "scrimmage" : "receiving";
    const td = p.position === "QB" ? `${p.passingTouchdowns} passing touchdowns, ${p.touchdowns} rushing/receiving touchdowns, and ${p.interceptionsThrown} interceptions` : `${p.touchdowns} touchdowns`;
    return `${p.name} combines big yardage with scoring: ${fmt(yards)} ${kind} yards and ${td} through ${p.games} team games. That's ${fmt(yards / p.games)} ${kind} yards per game, compared with ${fmt(p.averageYardsPerGame)} for qualifying ${p.position}s. His combination of yardage, touchdowns, and efficiency makes him our top offensive standout relative to his position.`;
  }
  const plays = [[p.sacks, "sack", "sacks"], [p.interceptions, "interception", "interceptions"], [p.passesDefended, "pass defended", "passes defended"], [p.tacklesForLoss, "tackle for loss", "tackles for loss"], [p.defensiveTouchdowns, "defensive touchdown", "defensive touchdowns"]].filter(([n]) => n > 0).map(([n, singular, plural]) => `${fmt(n)} ${n === 1 ? singular : plural}`);
  const why = p.sacks / p.games > p.averageSacksPerGame && p.sacks > 0 ? ` He averages ${fmt(p.sacks / p.games)} sacks per game versus ${fmt(p.averageSacksPerGame)} for qualifying ${p.position}s, consistently getting to the quarterback and stopping drives.` : separation;
  return `${p.name} stands out by disrupting plays, with ${plays.join(", ")} and ${fmt(p.tackles)} tackles through ${p.games} team games.${why} His combination of stops and disruptive plays gives him the strongest position-relative defensive score.`;
}
