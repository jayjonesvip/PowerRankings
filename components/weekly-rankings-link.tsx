export function WeeklyRankingsLink({league}:{league:"nfl"|"nhl"|"mlb"|"nba"}) {
  return <aside className="weekly-rankings-link"><div><span>Jay’s weekly column</span><a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${league}/power-rankings/`}>Jay’s {league.toUpperCase()} Power Rankings <span aria-hidden="true">→</span></a></div><small>New editions Tuesdays · 9 AM ET</small></aside>;
}
