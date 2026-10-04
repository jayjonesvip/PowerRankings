# Jay’s Power Rankings

A mobile-first NFL power rankings dashboard that turns completed games into an explainable weekly ranking of all 32 teams.

**Live site:** [nfl-power-rankings.jayjonesvip.chatgpt.site](https://nfl-power-rankings.jayjonesvip.chatgpt.site)

## What it does

- Ranks every NFL team from 32 to 1 after each completed week
- Explains each ranking using record, opponent quality, scoring, and defense
- Shows week-over-week movement and recent results
- Forecasts upcoming games with projected scores and favorites
- Tracks league scoring, touchdown types, longest scores, and game extremes
- Builds an “If the Playoffs Started Today” bracket for both conferences
- Supports historical seasons and weekly snapshots
- Uses a responsive, logo-free team identity system built from team colors

## Ranking formula

Each team receives a 0–100 score from five weighted signals:

| Signal | Weight | What it measures |
| --- | ---: | --- |
| Win quality | 30% | Opponent performance, with a smaller scoring-margin component |
| Overall record | 25% | Win percentage, with ties counting as half a win |
| Offense | 20% | Points scored per game compared with the league |
| Defense | 20% | Points allowed per game compared with the league |
| Recent form | 5% | Results and margins over the three most recent games |

Win quality is weighted **80% toward opponent strength** and **20% toward scoring margin**. That keeps a dominant win meaningful without allowing blowouts over weak teams to overpower the résumé.

## Playoff picture

The dashboard follows the NFL’s current 14-team playoff format:

- Four division leaders receive seeds 1–4 in each conference
- Three wild-card teams receive seeds 5–7
- The No. 1 seed receives the conference’s only first-round bye
- Wild Card matchups are 2 vs. 7, 3 vs. 6, and 4 vs. 5
- The Divisional Round reseeds, with No. 1 hosting the lowest remaining seed

Current ties use the applicable data available at the selected week: head-to-head results, division or conference record, common games, strength of victory, and strength of schedule. Point differential and Jay’s Power Index are used only when an early-season tie remains unresolved.

## Data source

The app reads publicly available, unofficial ESPN NFL JSON endpoints in the visitor’s browser. Completed scores power the rankings; game summaries power the dashboard’s scoring-play statistics.

ESPN does not publish or support this project. Team names, league names, and statistics belong to their respective owners. The interface intentionally avoids team logos.

## Tech stack

- TypeScript
- React and Vinext
- Tailwind CSS
- Lucide icons
- Cloudflare-compatible Sites deployment

## Run locally

Requirements: Node.js 22.13 or newer and pnpm.

```bash
pnpm install
pnpm dev
```

Then open the local URL printed in the terminal.

Create a production build with:

```bash
pnpm build
```

## Project structure

```text
app/
  page.tsx                 Multi-sport home
  nfl/page.tsx             NFL rankings and dashboard
components/
  game-forecast.tsx        Upcoming-game projections
  league-dashboard.tsx     League-wide statistics
  playoff-bracket.tsx      Current playoff field and matchups
lib/
  rankings.ts              ESPN scores and ranking model
  dashboard-data.ts        Scoring-play aggregation
  playoffs.ts              Seeding and tiebreak logic
```

## Planned data workflow

The next production step is a scheduled GitHub Action that saves ESPN snapshots as versioned JSON. That will make pregame forecasts auditable and allow clean “prediction vs. actual” reporting after each game.

## Disclaimer

Jay’s Power Rankings is an independent fan project for analysis and entertainment. Forecasts are model estimates, not sportsbook lines or betting advice.

---

Built by [Jay Jones](https://github.com/jayjonesvip).
