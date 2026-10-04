export const dataPath = (path: string) => `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/data/nfl/${path}`;
export async function readLocalData(path: string, signal?: AbortSignal) {
  const response = await fetch(dataPath(path), { cache: "no-store", signal });
  if (!response.ok) throw new Error(`Stored NFL data unavailable (${response.status}).`);
  return response.json();
}
export async function snapshotUpdatedAt(season: number): Promise<Date> {
  const manifest = await readLocalData(`${season}/manifest.json`) as { updatedAt: string };
  return new Date(manifest.updatedAt);
}
