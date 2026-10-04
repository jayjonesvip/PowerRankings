"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchWeekSchedule, type RankedTeam, type ScheduledGame } from "@/lib/rankings";
import { assessMatchup } from "@/lib/matchup";
type NextGame = ScheduledGame & { week: number };
type OpponentNote = { game?: NextGame; assessment?: ReturnType<typeof assessMatchup>; state: "loading" | "error" | "ready"; throughWeek: number };

export function useNextOpponents(season: number, week: number, teams: RankedTeam[], refreshedAt: string) {
  const key = `${season}-${week}-${refreshedAt}`;
  const [stored, setStored] = useState<{ key: string; games: NextGame[]; error: boolean } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const weeks = Array.from({ length: Math.max(0, 18 - week) }, (_, i) => week + i + 1);
    Promise.all(weeks.map(async nextWeek => (await fetchWeekSchedule(season, nextWeek, controller.signal)).map(game => ({ ...game, week: nextWeek }))))
      .then(rows => { if (!controller.signal.aborted) setStored({ key, games: rows.flat().sort((a, b) => a.date.localeCompare(b.date)), error: false }); })
      .catch(() => { if (!controller.signal.aborted) setStored({ key, games: [], error: true }); });
    return () => controller.abort();
  }, [season, week, key]);
  return useMemo(() => new Map(teams.map(team => {
    const current = stored?.key === key ? stored : null;
    const game = current?.games.find(g => g.homeId === team.id || g.awayId === team.id);
    const note: OpponentNote = { game, assessment: game ? assessMatchup(game, team, teams) : undefined,
      state: !current ? "loading" : current.error ? "error" : "ready", throughWeek: week };
    return [team.id, note];
  })), [teams, stored, key, week]);
}

export function NextOpponent({ note, team }: { note?: OpponentNote; team: RankedTeam }) {
  if (!note || note.state === "loading") return <div className="next-opponent">Loading next opponent…</div>;
  if (note.state === "error") return <div className="next-opponent">Next-opponent data unavailable.</div>;
  if (!note.game) return <div className="next-opponent">No remaining regular-season matchup.</div>;
  const { game, assessment } = note;
  const home = team.id === game.homeId;
  const opponent = home ? game.awayName : game.homeName;
  return <div className={`next-opponent ${assessment && assessment.margin >= 3 ? "favorable" : assessment && assessment.margin <= -3 ? "tough" : "close"}`}>
    <div><small>Next · Week {game.week}{game.week > note.throughWeek + 1 ? " · Bye next week" : ""}</small><b>{game.neutralSite ? "vs." : home ? "vs." : "at"} {opponent}</b><span>{assessment?.label ?? "Opponent profile pending"}</span></div>
    <p>{assessment?.reason ?? "Not enough completed-game data to assess this opponent yet."}</p>
  </div>;
}
