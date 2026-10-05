import { validateBaseballSnapshot } from "../lib/mlb-model.ts";
import { readFile, readdir, access } from "node:fs/promises";
await access("out/nfl/index.html");
await access("out/nhl/index.html");
const hockey = JSON.parse(await readFile("out/data/nhl/current.json", "utf8"));
if (hockey.schemaVersion !== 1 || hockey.teams.length !== 32 || !Number.isFinite(Date.parse(hockey.updatedAt)) ||
    hockey.rankingsReady !== hockey.teams.every(t => t.gamesPlayed >= 5) ||
    hockey.rankings.length !== (hockey.rankingsReady ? 32 : 0)) throw new Error("Invalid NHL export");
await access("out/index.html");
const mvp = JSON.parse(await readFile("out/data/nfl/mvp-current.json", "utf8"));
if (mvp.schemaVersion !== 1 || !Number.isFinite(Date.parse(mvp.updatedAt)) || !Number.isInteger(mvp.completedGames) || [mvp.offense, mvp.defense].some(p => p && (!p.reason || !Number.isFinite(p.index)))) throw new Error("Invalid MVP export");
const seasons = await readdir("out/data/nfl");
const published = JSON.parse(await readFile("out/data/nfl/current.json", "utf8"));
if (!seasons.includes(String(published.season)) || published.completedGames < 1 || mvp.season !== published.season) throw new Error("Invalid published regular-season selection");
for (const season of seasons.filter(name => /^\d{4}$/.test(name))) {
  const manifest = JSON.parse(await readFile(`out/data/nfl/${season}/manifest.json`, "utf8"));
  if (manifest.schemaVersion !== 1 || !Number.isFinite(Date.parse(manifest.updatedAt))) throw new Error("Invalid manifest");
  for (let week = 1; week <= 18; week++) {
    const payload = JSON.parse(await readFile(`out/data/nfl/${season}/week-${week}.json`, "utf8"));
    for (const event of payload.events.filter(e => e.status.type.completed)) {
      await access(`out/data/nfl/${season}/summaries/${event.id}.json`);
    }
  }
}
for (const name of await readdir("out/_next/static/chunks")) {
  if (name.endsWith(".js") && /site\.api\.espn\.com|api-web\.nhle\.com|statsapi\.mlb\.com/.test(await readFile(`out/_next/static/chunks/${name}`, "utf8"))) {
    throw new Error("Provider URL found in browser bundle");
  }
}
console.log("Static pages, all JSON dependencies, and browser bundles verified");

// Check rendered HTML, excluding scripts/RSC props: data must be real page markup.
const htmlText = async (path) => (await readFile(path, "utf8"))
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
const nflHtml = await htmlText("out/nfl/index.html");
if ((nflHtml.match(/class="team-card"/g) ?? []).length !== 32 ||
    !nflHtml.includes('id="division-standings"') || !nflHtml.includes('id="league-stats"') ||
    !/<section[^>]*id="rankings-panel"[^>]*hidden=""/.test(nflHtml) || !nflHtml.replace(/<[^>]*>/g, "").includes("AFC East")) {
  throw new Error("NFL standings, stats and all 32 rankings must be prerendered");
}
for (const player of [mvp.offense, mvp.defense].filter(Boolean)) {
  if (!nflHtml.includes(player.name) || !nflHtml.includes(player.reason.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;"))) {
    throw new Error("MVP names and explanations must be prerendered");
  }
}
const nhlHtml = await htmlText("out/nhl/index.html");
if (!nhlHtml.includes('id="division-standings"') || !nhlHtml.includes('id="rankings"') ||
    hockey.teams.some(team => !nhlHtml.includes(team.name))) throw new Error("NHL standings must be prerendered");
if (hockey.rankingsReady && !nhlHtml.includes("All 32 NHL power rankings")) throw new Error("NHL rankings missing from HTML");
const hubHtml = await htmlText("out/index.html");
if (!hubHtml.includes("NFL") || !hubHtml.includes("NHL") || hubHtml.includes("Loading league snapshot")) throw new Error("Home snapshot missing");
console.log("Rendered league standings, rankings, stats and MVP explanations verified without JavaScript");

for (const html of [nflHtml, nhlHtml]) {
  if (!html.includes('id="opponent-performance"') || !html.includes("Offense above expectation") || !html.includes("Defensive suppression")) {
    throw new Error("Opponent-adjusted metrics must appear in exported league HTML");
  }
}
console.log("Opponent-adjusted performance sections verified in league HTML");

const baseball = validateBaseballSnapshot(JSON.parse(await readFile("out/data/mlb/current.json", "utf8")));
const mlbHtml = await htmlText("out/mlb/index.html");
for (const id of ["division-standings", "league-leaders", "hitting-teams", "pitching-teams"]) {
  if (!mlbHtml.includes(`id="${id}"`)) throw new Error(`MLB section missing: ${id}`);
}
if (baseball.teams.some(t => !mlbHtml.includes(t.name.replaceAll("&", "&amp;"))) ||
    !mlbHtml.includes("Player home-run leader") || !mlbHtml.includes("Player batting-average leader") || !hubHtml.includes('id="mlb-board"')) throw new Error("MLB snapshot missing from exported HTML");
console.log("MLB regular-season JSON, division standings, team stats and player leaders verified");

for (const id of ["scoring-teams", "goaltending-teams"]) if (!nhlHtml.includes(`id="${id}"`)) throw new Error(`NHL stats section missing: ${id}`);
for (const team of hockey.teams) if (!Array.isArray(team.players) || !Array.isArray(team.goalies)) throw new Error("NHL club JSON missing");
console.log("NHL scoring, expandable player points, and goaltending JSON verified");

for (const [snapshot,html] of [[baseball,mlbHtml],[hockey,nhlHtml]]) {
  if (!snapshot.mvps || !html.includes('id="league-mvps"')) throw new Error("League MVP snapshot/markup missing");
  for (const pick of [...snapshot.mvps.first,...snapshot.mvps.second]) if (!html.includes(pick.name.replaceAll("&","&amp;"))) throw new Error("League MVP name not prerendered");
}
console.log("MLB and NHL MVP snapshots and prerendered cards verified");

for (const [html, first] of [[nflHtml, "league-stats"], [nhlHtml, "league-leaders"], [mlbHtml, "league-leaders"]]) {
  if (html.indexOf(`id="${first}"`) > html.indexOf('id="division-standings"') || !html.includes("Current season by the numbers")) throw new Error("Season summary must precede standings");
}
if (nflHtml.indexOf('id="division-standings"') > nflHtml.indexOf('id="playoff-picture"')) throw new Error("NFL standings must precede playoff picture");
console.log("Season summaries first and NFL standings before playoff picture verified");

if (baseball.seasonComplete) {
  if (baseball.playoffSeeds?.length !== 12 || !mlbHtml.includes('id="playoff-seeding"') || mlbHtml.indexOf('id="playoff-seeding"') < mlbHtml.indexOf('id="division-standings"')) throw new Error("MLB opening seeds missing or misplaced");
  for (const seed of baseball.playoffSeeds) if (!mlbHtml.includes(baseball.teams.find(t=>t.id===seed.id).name)) throw new Error("MLB opening team missing");
}
console.log("MLB completed-season opening playoff seeding verified");

for(const html of [nflHtml,nhlHtml,mlbHtml]) {
  if (!html.includes('id="standings-panel"') || !html.includes('id="standings-tab"') || !html.includes('aria-selected="true" aria-controls="dashboard-panel"')) throw new Error("Standings tab or default dashboard missing");
}
for(const id of ["hitting-panel","pitching-panel"]) if(!mlbHtml.includes(`id="${id}"`)) throw new Error("MLB team stats tab missing");
if(!nhlHtml.includes('id="playoff-picture"') || hockey.teams.some(t=>!Number.isInteger(t.divisionRank)||!Number.isInteger(t.conferenceRank))) throw new Error("NHL playoff picture/ranks missing");
console.log("Default dashboards, standings/playoff tabs, and separate MLB stats tabs verified");
