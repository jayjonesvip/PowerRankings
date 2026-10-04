import { readFile, readdir, access } from "node:fs/promises";
await access("out/nfl/index.html");
await access("out/index.html");
const seasons = await readdir("out/data/nfl");
if (!seasons.includes(String(new Date().getUTCFullYear()))) throw new Error("Missing current season");
for (const season of seasons) {
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
  if (name.endsWith(".js") && (await readFile(`out/_next/static/chunks/${name}`, "utf8")).includes("site.api.espn.com")) {
    throw new Error("Provider URL found in browser bundle");
  }
}
console.log("Static pages, all JSON dependencies, and browser bundles verified");
