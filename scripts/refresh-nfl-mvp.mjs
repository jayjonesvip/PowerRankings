import { readFile, writeFile, mkdir } from "node:fs/promises";
import { buildMvpSnapshot } from "./nfl-mvp-model.mjs";
const now = new Date(), season = now.getUTCFullYear() - (now.getUTCMonth() < 2 ? 1 : 0);
const root = `public/data/nfl/${season}`, events = new Map(), teams = new Set();
for (let week = 1; week <= 18; week++) {
  const payload = JSON.parse(await readFile(`${root}/week-${week}.json`, "utf8"));
  for (const event of payload.events) {
    for (const team of event.competitions[0].competitors) teams.add(team.team.id);
    if (event.status.type.completed) events.set(event.id, event);
  }
}
async function request(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`MVP source returned ${response.status}`);
      return await response.json();
    } catch (error) { if (attempt === 2) throw error; }
  }
}
const games = [];
for (const id of events.keys()) {
  const summary = JSON.parse(await readFile(`${root}/summaries/${id}.json`, "utf8"));
  if (summary.players?.length !== 2) throw new Error(`Player box score absent: ${id}`);
  games.push({ id, players: summary.players });
}
const rosters = [];
const ids = [...teams];
for (let i = 0; i < ids.length; i += 4) {
  rosters.push(...await Promise.all(ids.slice(i, i + 4).map(id => request(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${id}/roster?season=${season}`))));
}
if (rosters.length !== 32 || rosters.some(r => !r.athletes?.length)) throw new Error("Incomplete MVP rosters");
const manifest = JSON.parse(await readFile(`${root}/manifest.json`, "utf8"));
const result = buildMvpSnapshot({ season, updatedAt: manifest.updatedAt, games, rosters });
if (games.length && (!result.offense || !result.defense) && games.length >= 32) throw new Error("Missing MVP candidates");
await mkdir("public/data/nfl", { recursive: true });
await writeFile("public/data/nfl/mvp-current.json", JSON.stringify(result));
console.log(`NFL MVP snapshot: ${games.length} finals; ${result.offense?.name ?? "building sample"} / ${result.defense?.name ?? "building sample"}`);
