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
if (!seasons.includes(String(new Date().getUTCFullYear()))) throw new Error("Missing current season");
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
  if (name.endsWith(".js") && /site\.api\.espn\.com|api-web\.nhle\.com/.test(await readFile(`out/_next/static/chunks/${name}`, "utf8"))) {
    throw new Error("Provider URL found in browser bundle");
  }
}
console.log("Static pages, all JSON dependencies, and browser bundles verified");
