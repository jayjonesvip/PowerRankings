# Jay’s Power Rankings

A mobile-first sports dashboard with NFL power rankings and an NHL league dashboard and power index.

**Live site:** [nfl-power-rankings.jayjonesvip.chatgpt.site](https://nfl-power-rankings.jayjonesvip.chatgpt.site)

## What it does

- Ranks every NFL team from 32 to 1 after each completed week
- Explains each ranking using record, opponent quality, scoring, and defense
- Shows week-over-week movement and recent results
- Adds next-opponent matchup assessments to each NFL ranking card
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

GitHub Actions fetches ESPN scoreboards and scoring-play summaries hourly at minute 17 UTC, validates them, and stores JSON under `public/data/nfl/`. The browser reads only same-origin JSON. A failed sync stops deployment, preserving the last successful site.

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
  next-opponent.tsx        Next-opponent matchup assessments
  league-dashboard.tsx     League-wide statistics
  playoff-bracket.tsx      Current playoff field and matchups
  division-standings.tsx   NHL and NFL standings grouped by division
lib/
  rankings.ts              ESPN scores and ranking model
  dashboard-data.ts        Scoring-play aggregation
  playoffs.ts              Seeding and tiebreak logic
```

## Hourly data workflow

Enable GitHub Pages with Source set to GitHub Actions. The workflow runs on main pushes, manual dispatch, and hourly schedules. GitHub may delay scheduled jobs. JSON is included in the deployed Pages artifact and reused through Actions cache; it is not committed. Archived seasons from 2022 are reused; current-season scores and summaries refresh each run.

Run `pnpm data:refresh` before local development, `pnpm test:data` for validation checks, and `pnpm build:github` for a static export. This workflow publishes GitHub Pages. Pregame prediction history is not yet stored.

## Disclaimer

Jay’s Power Rankings is an independent fan project for analysis and entertainment. Forecasts are model estimates, not sportsbook lines or betting advice.

---

Built by [Jay Jones](https://github.com/jayjonesvip).

## NHL

The hourly workflow also fetches official NHL standings and all 32 team schedules. Preseason and playoffs are excluded. Stored JSON lives at `public/data/nhl/current.json` and is published with the site. The NHL page opens on League Dashboard; Power Rankings is the second tab. Rankings automatically activate when all 32 teams have five completed regular-season games. Standings and schedule game counts must agree before publishing; invalid, inconsistent, or truncated responses stop deployment. No manual data confirmation is needed.

Run `pnpm data:refresh:nhl` before a local static build. NHL scores use authoritative standings points (including overtime losses), goal rates, opponent quality, and five-game recent form. The standings table is a league overview and does not implement all official playoff tiebreakers.

## NFL league MVPs

The current dashboard shows separate offensive and defensive statistical MVPs, with a plain-language reason. Actions retains completed-game player box scores and runs `pnpm data:refresh:mvp` after the NFL sync. It publishes `public/data/nfl/mvp-current.json`; browsers read only this same-origin JSON. Picks use 75% position-standardized production per team game and 25% efficiency/disruption. Qualifying players need two appearances and a minimum workload. Blocking, coverage quality, and special teams are outside the model. Run both NFL refresh commands before a local build.

### Opponent-adjusted performance

NFL and NHL dashboards show leaders in offense above expectation and defensive suppression, with team comparisons in the rankings. For each completed game, offense is scoring minus the opponent's average allowed in its other games; defense is the opponent's average scoring in its other games minus scoring allowed. The evaluated game is excluded from both baselines. Opponents need two other completed games. Each qualifying game has equal weight, and both metrics reward positive values. Leaderboards require three qualifying games; samples below five are labeled limited. NHL shootout deciding goals are removed, while overtime goals count. NFL scoring includes offense, defense and special teams. These descriptive comparisons use stored same-origin JSON, are prerendered in page HTML, and do not alter the power-ranking formula.
