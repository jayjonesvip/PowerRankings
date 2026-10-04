import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

export function validateWeek(payload) {
  if (!Array.isArray(payload.events)) throw new Error("Invalid scoreboard");
  const ids = new Set();
  for (const e of payload.events) {
    const teams = e.competitions?.[0]?.competitors;
    if (!/^\d+$/.test(e.id) || ids.has(e.id) || !Number.isFinite(Date.parse(e.date)) ||
        typeof e.status?.type?.completed !== "boolean" || teams?.length !== 2 ||
        !teams.some(t => t.homeAway === "home") || !teams.some(t => t.homeAway === "away") ||
        teams.some(t => !t.team?.id || !t.team?.displayName || !t.team?.abbreviation ||
          (e.status.type.completed && (t.score == null || !Number.isFinite(Number(t.score)))))) {
      throw new Error("Malformed game");
    }
    ids.add(e.id);
  }
  return payload;
}

async function request(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
      return await response.json();
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

export async function refresh() {
  const root = resolve("public/data/nfl");
  const year = new Date().getUTCFullYear();
  const active = new Date().getUTCMonth() < 2 ? year - 1 : year;
  const endpoint = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
  const pending = [];
  for (let season = 2022; season <= year; season++) {
    const dir = join(root, String(season));
    let previous;
    try { previous = JSON.parse(await readFile(join(dir, "manifest.json"), "utf8")); } catch {}
    const archived = season < active && previous?.schemaVersion === 1;
    let count = 0;
    let completed = 0;
    for (let week = 1; week <= 18; week++) {
      const filename = join(dir, `week-${week}.json`);
      const payload = validateWeek(archived
        ? JSON.parse(await readFile(filename, "utf8"))
        : await request(`${endpoint}/scoreboard?season=${season}&seasontype=2&week=${week}&limit=100`));
      count += payload.events.length;
      completed += payload.events.filter(e => e.status.type.completed).length;
      pending.push([filename, payload]);
      for (const event of payload.events.filter(e => e.status.type.completed)) {
        const filename = join(dir, "summaries", `${event.id}.json`);
        const summary = archived ? JSON.parse(await readFile(filename, "utf8"))
          : await request(`${endpoint}/summary?event=${event.id}`);
        if (!Array.isArray(summary.scoringPlays)) throw new Error(`Missing scoring plays: ${event.id}`);
        pending.push([filename, { scoringPlays: summary.scoringPlays }]);
      }
    }
    if (season <= active && !count) throw new Error(`Empty schedule: ${season}`);
    if (previous && (count < previous.events || completed < (previous.completed || 0))) {
      throw new Error(`Refusing a truncated season: ${season}`);
    }
    pending.push([join(dir, "manifest.json"), { schemaVersion: 1, season, updatedAt: archived ? previous.updatedAt : new Date().toISOString(), events: count, completed }]);
    console.log(`Validated ${season}: ${count} games`);
  }
  // No files change until all upstream requests and validations succeed.
  for (const [filename, payload] of pending) {
    await mkdir(resolve(filename, ".."), { recursive: true });
    await writeFile(filename, JSON.stringify(payload));
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await refresh();
