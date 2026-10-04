"use client";
import { useEffect, useState } from "react";
import { Shield, Trophy } from "lucide-react";
import { readLocalData } from "@/lib/local-data";
type Mvp = { name: string; team: string; position: string; index: number; reason: string };
type Snapshot = { schemaVersion: number; season: number; completedGames: number; updatedAt: string; offense: Mvp | null; defense: Mvp | null; methodology: string };

export function NflLeagueMvps({ season, completedGames, refreshToken }: { season: number; completedGames: number; refreshToken: number }) {
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    readLocalData("mvp-current.json", controller.signal).then((value) => {
      const snapshot = value as Snapshot;
      if (snapshot.schemaVersion !== 1 || snapshot.season !== season || !Number.isFinite(Date.parse(snapshot.updatedAt))) throw new Error("Invalid MVP snapshot");
      setData(snapshot);
    }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [season, refreshToken]);
  const current = data?.season === season && data.completedGames === completedGames;
  return <section className="league-mvp-section" aria-label="NFL league MVPs">
    <div className="dashboard-heading"><div><p className="eyebrow">Standouts above the average</p><h2>League MVPs</h2></div><span>Current season · Offense &amp; defense</span></div>
    {error ? <p role="status">MVP snapshot unavailable. Refresh to retry.</p> : !current ? <p role="status">Loading the current MVP snapshot…</p> : <>
      <div className="league-mvp-grid">{(["offense", "defense"] as const).map(side => {
        const player = data[side];
        return <article className="data-panel league-mvp-card" key={side}>
          <div className="panel-title"><div><p className="eyebrow">{side === "offense" ? "Offensive MVP" : "Defensive MVP"}</p><h3>{player?.name ?? "Building the sample"}</h3></div>{side === "offense" ? <Trophy /> : <Shield />}</div>
          {player ? <div className="league-mvp-body"><p className="league-mvp-team">{player.team} · {player.position}</p><p>{player.reason}</p></div> : <div className="league-mvp-body"><p>Players qualify after at least two appearances and enough regular-season workload for a fair comparison.</p></div>}
        </article>;
      })}</div>
      <p className="league-mvp-note">Our statistical MVP picks compare production and efficiency against players at the same position. Season to date through {data.completedGames} completed games. Offensive linemen and special teams are outside this box-score model.</p>
    </>}
  </section>;
}
