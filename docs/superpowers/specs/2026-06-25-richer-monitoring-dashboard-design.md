# Richer Monitoring Dashboard — Design

**Date:** 2026-06-25
**Status:** Approved (design); ready for implementation plan

## Goal

Upgrade the existing GitHub Pages dashboard from a per-run report archive into a
monitoring view that shows test health *over time*. Keep the project's
zero-runtime-dependency, build-time static-HTML architecture and clean
`npm audit`.

## Context (current state)

The dashboard is generated at build time and published to the `gh-pages` branch
by the `deploy-dashboard` CI job.

- `scripts/build-pages-dashboard.mjs` — orchestrator: copies report artifacts
  into `pages/runs/<run-id>/`, reads Monocart `index.json` for per-run metrics,
  writes `runs.json`, and renders `index.html` + per-run report-hub pages.
- `scripts/dashboard/template.mjs` — one file mixing page assembly
  (`buildRootPage`, `buildReportHub`, `buildPage`), metric helpers
  (`buildSummaryCards`, `buildRunMetrics`, `totalReports` lives in the build
  script), and formatters (`escapeHtml`, `formatPassed`, `formatDate`).
- `scripts/dashboard/dashboard.css` — light-theme styling.

`runs.json` entries already carry per-run totals:

```json
{
  "id": "...", "number": "30", "attempt": "1", "branch": "main",
  "sha": "a1ccbc7", "createdAt": "2026-06-25T14:30:00Z",
  "actionUrl": "...", "monocart": "runs/.../monocart/", "playwright": "runs/.../playwright/",
  "reports": { "ui": {"tests":18,"passed":18,"failed":0,"skipped":0,"flaky":0,"duration":"1.4m"},
               "api": {"tests":9,"passed":9,"failed":0,"skipped":0,"flaky":0,"duration":"1.0m"} },
  "totals": { "tests":27,"passed":27,"failed":0,"skipped":0,"flaky":0 }
}
```

So the trend widgets need no new data extraction — only aggregation of data
already stored.

## Scope

### In scope

1. **Three monitoring widgets**, all rendered as build-time inline SVG/HTML
   (no client JavaScript):
   - **KPI header cards** — latest pass rate, tests run, flaky count, green streak.
   - **Pass-rate trend** — line + area chart of pass % across the last N runs.
   - **Status timeline** — one colored square per run (passed / flaky / failed),
     each linking to that run's report hub.
2. **Prominent report access** preserved/strengthened — three paths to the real
   Monocart/Playwright HTML reports (hero buttons, timeline squares, history pills).
3. **Modular refactor** of `scripts/dashboard/` into focused, testable modules.
4. **History cap + retention** — bound `runs.json` and `gh-pages` size.
5. **Unit tests** for the pure modules via a Playwright node-only test project.
6. **Docs update** in `docs/monitoring-dashboard.md`.

### Out of scope (non-goals)

- Per-test flaky/failure tracking (needs per-test extraction — de-scoped).
- Duration trend chart (de-scoped during brainstorming).
- Any client-side JavaScript, interactivity beyond native SVG `<title>` tooltips
  and `<a>` links, or charting libraries (zero-dep ethos).
- Cross-browser test coverage changes.

## Architecture

Split `scripts/dashboard/` by responsibility so each unit has one purpose, a
clear interface, and can be tested in isolation.

| Module | Responsibility | Purity |
| --- | --- | --- |
| `scripts/dashboard/html.mjs` | `escapeHtml`, `buildPage` (page shell), `formatDate`, `formatPassed` | pure |
| `scripts/dashboard/metrics.mjs` | `runStatus`, `computeKpis`, `buildPassRateSeries`, `capRuns`, `totalReports`, `summaryValue` | pure |
| `scripts/dashboard/charts.mjs` | `passRateChartSvg(series)`, `statusTimelineSvg(runs)` → SVG/HTML strings | pure |
| `scripts/dashboard/template.mjs` | `buildRootPage`, `buildReportHub` — compose charts + metrics + html | pure |
| `scripts/build-pages-dashboard.mjs` | IO orchestration: artifacts, file reads/writes, cap, prune | impure (IO) |

`build-pages-dashboard.mjs` stays the only module that touches the filesystem.
All rendering and aggregation logic becomes pure functions that take data and
return strings/objects — directly unit-testable without a browser or filesystem.

## Data model & derivations

No schema change to `runs.json`. New derivations (pure, in `metrics.mjs`):

- **`runStatus(run)`** → `'failed'` if `totals.failed > 0`; else `'flaky'` if
  `totals.flaky > 0`; else `'passed'` if `totals.tests > 0`; else `'unknown'`.
- **`buildPassRateSeries(runs, max)`** → chronological (oldest→newest) array of
  `{ number, pct, passed, tests }` for runs that have `totals`, where
  `pct = round(passed / tests * 100)`. `runs.json` is stored newest-first, so the
  series reverses it.
- **`computeKpis(runs)`** → `{ passRate, tests, flaky, greenStreak }` from the
  latest run, where **green streak** = count of consecutive most-recent runs with
  `totals.failed === 0` (flaky runs do not break the streak; this is documented).
- **`capRuns(runs, max)`** → newest-first slice to `max` entries.

## Widget specs

**KPI header cards** — four `.kpi` cards in the hero: latest pass rate (%), tests
run, flaky (latest), green streak. Colored values (green/blue/amber). Empty state
when no runs.

**Pass-rate trend** (`passRateChartSvg`) — inline `<svg>` with axis lines, 100/75/50%
gridlines, an area polygon, a polyline, and a `<circle>` per point. Each point
carries a native `<title>` (`Run #N · passed/tests · pct% pass`) for zero-JS
hover tooltips. Renders an empty-state message when the series is empty.

**Status timeline** (`statusTimelineSvg`) — a flex row of `<a class="sq {status}">`
squares, oldest→newest, each linking to the run's report hub and carrying a
`<title>` with run number, result, and date. Legend below (passed/flaky/failed).
All dynamic text passes through `escapeHtml`.

## Report access (preserved)

1. **Hero buttons** — "Open latest Monocart report" / "Open latest Playwright
   report" for the latest run.
2. **Timeline square** — links to that run's report hub.
3. **History row pills** — Monocart / Playwright / Actions per run.

Navigation chain unchanged: dashboard → run report hub (`buildReportHub`) →
UI/API → Monocart/Playwright HTML report.

## Build flow changes (`build-pages-dashboard.mjs`)

1. Build the enriched runs list as today (current run + existing `runs.json`,
   metrics backfilled from Monocart `index.json`).
2. **Cap:** sort newest-first and slice to `DASHBOARD_MAX_RUNS` (default **30**)
   before writing `runs.json`.
3. **Prune:** remove `pages/runs/<id>/` directories whose `id` is not in the
   capped set (always keep the current run). This bounds `gh-pages` size.
4. Render `index.html` (now with KPI cards + pass-rate chart + status timeline +
   run history) and per-run report hubs using the capped runs.

### Configuration

- `DASHBOARD_MAX_RUNS` — integer, default `30`. Caps trends, timeline, and
  retained run folders.
- Existing env vars (`PAGES_DIR`, `ARTIFACTS_DIR`, `GITHUB_*`) unchanged.

## Testing

Add a Playwright **node-only** test project (no browser, no `baseURL`):

- `playwright.config.ts` — new project `dashboard`, `testDir: './tests/dashboard'`.
  Playwright's default `testMatch` already includes `.mjs`, so no extra config.
- `package.json` — script `test:dashboard` → `playwright test --project=dashboard`.
- `tests/dashboard/metrics.spec.mjs` — `runStatus` branches; `computeKpis` pass
  rate + green-streak (including flaky-doesn't-break-streak); `buildPassRateSeries`
  ordering and pct values; `capRuns` slicing.
- `tests/dashboard/charts.spec.mjs` — `passRateChartSvg` produces one point per
  series entry and an empty state for `[]`; `statusTimelineSvg` produces one
  square per run with the correct status class and HTML-escaped titles.

**Why `.mjs` specs, not `.ts`:** the dashboard modules are plain `.mjs` (matching
the existing `scripts/*.mjs`, which run directly under `node` in CI with no build
step — keeping that avoids adding a TS runtime loader and a new dependency). Under
the current `tsconfig.json` (`moduleResolution: "Node"`, no `allowJs`,
`include: ["tests/**/*.ts", ...]`), a `.ts` spec importing `./metrics.mjs` would
fail `tsc` (explicit `.mjs` import specifier + no declarations). Writing the specs
as `.mjs` sidesteps this: Playwright discovers them, ESLint's base `recommended`
config lints them (it already lints `scripts/*.mjs` today), and `tsc` stays scoped
to `.ts` only.

**Coverage reality:** `tsc --noEmit` does **not** typecheck the new `.mjs` files —
same as today's `scripts/*.mjs`. `lint` covers them via the base config; the
Playwright plugin's test-hygiene rules (scoped to `tests/**/*.ts`) do not apply to
`.mjs` specs, which is acceptable for pure-function unit tests. *Optional:* add
`// @ts-check` + JSDoc `@typedef`s to the pure modules for lightweight type safety
with no build step.

## CI changes (`.github/workflows/playwright.yml`)

- Add a lightweight **`dashboard-tests`** job (node only, `npm ci` +
  `npm run test:dashboard`), no browser install.
- `deploy-dashboard` gains `needs: dashboard-tests` so broken templates/metrics
  can't publish.
- Build step unchanged except it honors `DASHBOARD_MAX_RUNS` (default applies).

## Docs

Update `docs/monitoring-dashboard.md`: document the three widgets, the KPI set and
green-streak definition, the `DASHBOARD_MAX_RUNS` cap/retention behavior, and the
new `test:dashboard` command. Remove the now-implemented "richer report
annotations / retention policy" items from Improvement Ideas as appropriate.

## Risks & limitations

- Trends only go back `DASHBOARD_MAX_RUNS`; older history is intentionally dropped.
- Status/pass-rate derive from run totals, so a run lacking Monocart JSON shows as
  `unknown` and is skipped from the pass-rate series (existing behavior).
- Native SVG `<title>` tooltips are basic (no styling/positioning control) — the
  accepted trade-off for zero client JS.

## File-by-file change summary

| File | Change |
| --- | --- |
| `scripts/dashboard/html.mjs` | **new** — escape + page shell + formatters |
| `scripts/dashboard/metrics.mjs` | **new** — pure aggregations/derivations |
| `scripts/dashboard/charts.mjs` | **new** — pass-rate + timeline SVG generators |
| `scripts/dashboard/template.mjs` | refactor — compose new modules; add widgets to `buildRootPage` |
| `scripts/dashboard/dashboard.css` | add KPI / chart / timeline styles |
| `scripts/build-pages-dashboard.mjs` | add cap + prune; use `metrics.mjs`; thinner |
| `playwright.config.ts` | add node-only `dashboard` project |
| `package.json` | add `test:dashboard` script |
| `tests/dashboard/metrics.spec.mjs` | **new** — unit tests |
| `tests/dashboard/charts.spec.mjs` | **new** — unit tests |
| `.github/workflows/playwright.yml` | add `dashboard-tests` job; gate deploy |
| `docs/monitoring-dashboard.md` | document widgets, KPIs, retention, tests |
