export type RankingLeague = "nfl" | "nhl" | "mlb" | "nba";
export type WeeklyTeam = {
  id:string; name:string; abbreviation:string; rank:number; score:number; record:string;
  movement:number|null; story:string; stats:{label:string;value:string}[];
  recent?:string[]; next?:{opponent:string;label:string;reason:string};
};
export type WeeklyPost = {
  schemaVersion:1; league:RankingLeague; season:number; seasonComplete:boolean; ready:boolean;
  slot:string; publishedAt:string|null; asOf:string; completedGames:number; week?:number;
  headline:string; introduction:string; methodology:string; teams:WeeklyTeam[];
};
export function validateWeeklyPost(post:WeeklyPost):WeeklyPost {
  const expected = {nfl:32,nhl:32,mlb:30,nba:30}[post.league];
  if (post.schemaVersion!==1 || !expected || !Number.isInteger(post.season) || typeof post.ready!=="boolean" || typeof post.seasonComplete!=="boolean" || !/^\d{4}-\d{2}-\d{2}$/.test(post.slot) || !Number.isFinite(Date.parse(post.asOf)) || !Number.isInteger(post.completedGames) || post.completedGames<0 || !post.headline || !post.introduction || !post.methodology ||
      (post.ready ? !post.publishedAt || !Number.isFinite(Date.parse(post.publishedAt)) || post.teams.length!==expected : post.teams.length!==0 || post.publishedAt!==null)) throw new Error("Invalid weekly post");
  if (new Set(post.teams.map(t=>t.id)).size!==post.teams.length || post.teams.some((t,i)=>t.rank!==i+1 || !t.name || !t.abbreviation || !t.record || !t.story || !Number.isFinite(t.score) || t.score<0 || t.score>100 || (t.movement!==null && !Number.isInteger(t.movement)) || !Array.isArray(t.stats) || t.stats.some(s=>!s.label || typeof s.value!=="string"))) throw new Error("Invalid weekly ranking teams");
  return post;
}
