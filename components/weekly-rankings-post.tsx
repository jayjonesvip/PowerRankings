import type { Metadata } from "next";
import { readWeeklyPost } from "@/lib/weekly-posts";
import type { RankingLeague } from "@/lib/weekly-rankings";
const base=process.env.NEXT_PUBLIC_BASE_PATH||"";
const title=(league:RankingLeague)=>`Jay’s ${league.toUpperCase()} Power Rankings`;
const date=(value:string)=>new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",month:"long",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit",timeZoneName:"short"}).format(new Date(value));
const url=(league:RankingLeague)=>`https://jayjonesvip.github.io${process.env.NEXT_PUBLIC_BASE_PATH||"/PowerRankings"}/${league}/power-rankings/`;
export async function rankingPostMetadata(league:RankingLeague):Promise<Metadata> {
  const post=await readWeeklyPost(league);
  return {title:`${title(league)} | League Snapshot`,description:post?.introduction??`Weekly ${league.toUpperCase()} rankings, published Tuesdays at 9 AM Eastern after the regular-season sample is ready.`,alternates:{canonical:url(league)},icons:{icon:`${base}/jays-logo.png`,shortcut:`${base}/jays-logo.png`,apple:`${base}/jays-logo.png`},openGraph:{title:title(league),description:post?.introduction,type:"article",url:url(league),...(post?.publishedAt?{publishedTime:post.publishedAt,modifiedTime:post.publishedAt}:{})}};
}
export async function WeeklyRankingsPost({league}:{league:RankingLeague}) {
  const post=await readWeeklyPost(league),upper=league.toUpperCase();
  const structured=post?.ready?{"@context":"https://schema.org","@type":"BlogPosting",headline:`${title(league)}: ${post.headline}`,description:post.introduction,datePublished:post.publishedAt,dateModified:post.publishedAt,author:{"@type":"Person",name:"Jay"},publisher:{"@type":"Organization",name:"League Snapshot"},mainEntityOfPage:url(league),about:{"@type":"ItemList",numberOfItems:post.teams.length,itemListElement:post.teams.map(t=>({"@type":"ListItem",position:t.rank,name:t.name}))}}:null;
  return <main className="weekly-post-page">
    <header className="site-header"><a className="brand" href={`${base}/`} aria-label="League Snapshot home"><img className="brand-mark" src={`${base}/jays-logo.png`} alt="Jay’s portrait logo" width="52" height="52"/><span><b>{title(league)}</b><small>A LEAGUE SNAPSHOT COLUMN</small></span></a><nav className="league-nav" aria-label="Weekly ranking columns">{(["nfl","nhl","mlb","nba"] as const).map(s=><a key={s} href={`${base}/${s}/power-rankings/`} aria-current={s===league?"page":undefined}>{s.toUpperCase()}</a>)}</nav><span className="header-status">Weekly · Tuesdays at 9 AM ET</span></header>
    {structured&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structured).replace(/</g,"\\u003c")}}/>}
    <article className="weekly-column">
      <a className="weekly-back" href={`${base}/${league==="nba"?"":`${league}/`}`}>← {league==="nba"?"League Snapshot":"Back to the "+upper+" snapshot"}</a>
      <header className="weekly-article-heading"><p className="eyebrow">Jay’s weekly column · {post?.seasonComplete?"Final regular-season edition":"Regular season only"}</p><h1>{title(league)}</h1><p className="weekly-deck">{post?.headline??"The season’s story starts here"}</p>
        {post?.ready&&post.publishedAt?<><p className="weekly-byline">By Jay · Published <time dateTime={post.publishedAt}>{date(post.publishedAt)}</time></p><p className="weekly-as-of">Rankings as of <time dateTime={post.asOf}>{date(post.asOf)}</time>{post.week?` · Through Week ${post.week}`:""} · {post.completedGames.toLocaleString("en-US")} completed games</p></>:<p className="weekly-byline">By Jay · First edition pending</p>}
        <p className="weekly-introduction">{post?.introduction??"NBA rankings will appear after every team has played five regular-season games and the league’s stored data is available. The weekly column will publish Tuesdays at 9 AM Eastern."}</p>
        <p className="weekly-cadence">{post?.seasonComplete?"This final regular-season edition stays in place until a new qualifying regular season is ready.":"A weekly read: this edition stays fixed while the league snapshot updates hourly. New editions are scheduled for Tuesdays at 9 AM Eastern."}</p>
      </header>
      {post?.ready?<><section className="weekly-takeaways" aria-label="This edition at a glance"><h2>This week at a glance</h2><p><strong>Setting the pace:</strong> {post.teams.slice(0,3).map(t=>`#${t.rank} ${t.name}`).join(" · ")}</p>{post.teams.some(t=>(t.movement??0)>0)&&<p><strong>Biggest climb:</strong> {(()=>{const t=[...post.teams].sort((a,b)=>(b.movement??0)-(a.movement??0))[0];return `${t.name}, up ${t.movement} spots from the previous published edition.`;})()}</p>}</section>
        <div className="weekly-team-stories">{post.teams.map(team=><section className="weekly-team-story" id={`team-${team.abbreviation.toLowerCase()}`} key={team.id}><div className="weekly-team-heading"><span className="weekly-rank">{team.rank}</span><div><h2>{team.name}</h2><p>{team.record} · {team.movement===null?"Movement tracking starts next edition":team.movement>0?`↑ Up ${team.movement} from last edition`:team.movement<0?`↓ Down ${Math.abs(team.movement)} from last edition`:"Same spot as last edition"}</p></div></div><p className="weekly-team-take">{team.story}</p>{team.next&&<p className="weekly-next"><strong>Next up: {team.next.opponent}.</strong> {team.next.label}.</p>}
          <details className="weekly-team-stats"><summary>Open the numbers <span>Index {team.score.toFixed(1)}</span></summary><dl>{team.stats.map(stat=><div key={stat.label}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}</dl>{team.recent?.length&&<p><strong>Recent results:</strong> {team.recent.join(" · ")}</p>}{team.next&&<p><strong>Matchup context:</strong> {team.next.reason}</p>}</details>
        </section>)}</div>
      </>:<section className="weekly-takeaways"><h2>Building the sample</h2><p>The league snapshot is available separately. Rankings wait for regular-season results so that early impressions do not masquerade as a full-season picture.</p></section>}
      {post&&<details className="weekly-method"><summary>How Jay’s rankings work</summary><p>{post.methodology}</p><p>Commentary is generated from the published statistical snapshot. No preseason or postseason games are included. Movement compares published weekly editions, not hourly standings.</p></details>}
      <footer className="weekly-signoff"><p>Jay’s view of the numbers. Official standings, MVPs, and team stats live in League Snapshot.</p><a href={`${base}/${league==="nba"?"":`${league}/`}`}>Explore {league==="nba"?"League Snapshot":`the ${upper} snapshot`} →</a></footer>
    </article>
  </main>;
}
