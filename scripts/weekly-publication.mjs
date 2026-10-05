// Tuesday 9 AM Eastern, including daylight saving time.
export function publicationSlot(now = new Date()) {
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid publication time");
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone:"America/New_York", year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", hourCycle:"h23" }).formatToParts(now).map(p=>[p.type,p.value]));
  const calendar = new Date(Date.UTC(Number(parts.year), Number(parts.month)-1, Number(parts.day)));
  let back = (calendar.getUTCDay()-2+7)%7;
  if (back===0 && Number(parts.hour)<9) back=7;
  calendar.setUTCDate(calendar.getUTCDate()-back);
  return calendar.toISOString().slice(0,10);
}
export function shouldPublish(previous, source, now = new Date()) {
  if (previous && previous.season > source.season) return false;
  if (previous?.ready && !source.ready) return false;
  if (previous?.ready && previous.season===source.season && previous.seasonComplete && previous.completedGames===source.completedGames) return false;
  if (!previous) return true; // First-install seed; subsequent editions are scheduled.
  const today = new Intl.DateTimeFormat("en-CA", {timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
  const slot = publicationSlot(now);
  return today===slot && slot>previous.slot;
}
