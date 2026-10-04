import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateWeek } from "../scripts/refresh-nfl.mjs";
test("malformed upstream data fails validation", () => {
  assert.throws(() => validateWeek({}));
  assert.throws(() => validateWeek({ events: [{ id: "123" }] }));
  assert.deepEqual(validateWeek({ events: [] }), { events: [] });
});
test("browser data modules contain no remote provider or fallback", async () => {
  for (const file of ["lib/rankings.ts", "lib/dashboard-data.ts", "lib/local-data.ts", "components/nfl-league-mvps.tsx"]) {
    assert.doesNotMatch(await readFile(file, "utf8"), /https?:\/\//);
  }
});
