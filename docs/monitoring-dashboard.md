# Monitoring Dashboard

This dashboard explains how project health is monitored through GitHub Actions, GitHub Pages, Playwright reports, Monocart reports, and local verification commands.

## Health Overview

| Area | Signal | Source | Expected State |
| --- | --- | --- | --- |
| Build quality | TypeScript compiles | `Typecheck` CI job | Passing |
| Code quality | ESLint rules pass | `Lint` CI job | Passing |
| Dependency risk | High-severity audit findings absent | `Security Audit` CI job | Passing |
| UI behavior | SauceDemo scenarios pass | `UI Tests` CI job | Passing |
| API behavior | GoREST scenarios pass | `API Tests` CI job | Passing |
| Report history | Latest and historical reports are published | GitHub Pages `gh-pages` branch | Available after successful `main` runs and manual workflow runs |
| Reports | HTML and Monocart artifacts uploaded | GitHub Actions artifacts | Available after each test job |

## CI Quality Gates

GitHub Actions runs on pull requests targeting `main`, pushes to `main`, and manual runs from the GitHub Actions **Run workflow** button.

| Job | Command | Blocks Later Jobs | What It Protects |
| --- | --- | --- | --- |
| `Typecheck` | `npm run typecheck` | Yes | Prevents TypeScript errors from reaching test jobs. |
| `Lint` | `npm run lint` | Yes | Keeps code style and Playwright usage consistent. |
| `Security Audit` | `npm run security:audit` | Yes | Fails on high-severity npm dependency issues. |
| `UI Tests` | `npm run test:ui` | No | Validates user-facing SauceDemo workflows. |
| `API Tests` | `npm run test:api` or token-free fallback | No | Validates GoREST API behavior and schemas. |

The UI and API jobs wait for static checks first. This saves runtime because browser/API tests do not run when the code already fails typecheck, lint, or audit.

## GitHub Pages Dashboard

The `Deploy Dashboard` job runs after UI and API tests pass for pushes to `main` and manual workflow runs. The manual **Run workflow** button appears after this workflow file exists on the default branch.

It publishes a static dashboard to the `gh-pages` branch with this structure:

```text
index.html
runs.json
runs/
  <github-run-id>/
    monocart/
      index.html
      ui/
      api/
    playwright/
      index.html
      ui/
      api/
```

The dashboard home page shows a monitoring summary with latest result, runs tracked, green run count, and historical failure count. It also has two primary buttons for the latest run:

- **Open Monocart report**
- **Open Playwright report**

It also keeps a run history list with pass/fail totals, UI/API durations, and links to each historical report, so older results remain visible as the project runs over time.

To make the dashboard public, configure GitHub Pages to deploy from the `gh-pages` branch at the repository root. For private repositories, confirm the repository plan and visibility settings before publishing reports.

## Test Layers

| Layer | Files | External Dependency | Main Risk Covered |
| --- | --- | --- | --- |
| UI | `tests/ui/*.spec.ts` | `https://www.saucedemo.com/` | Broken user journeys, incorrect page behavior, checkout validation gaps. |
| API | `tests/api/users.spec.ts` | `https://gorest.co.in/public/v2/` | Contract drift, auth enforcement, CRUD behavior, error responses. |
| Static | `tsconfig.json`, ESLint config, npm audit | npm registry for audit | Type errors, lint issues, vulnerable dependencies. |

## Reports and Artifacts

| Artifact | Produced By | Contains | Retention |
| --- | --- | --- | --- |
| `playwright-report-ui` | `UI Tests` | Playwright HTML report for UI tests | 7 days |
| `playwright-report-api` | `API Tests` | Playwright HTML report for API tests | 7 days |
| `monocart-report-ui` | `UI Tests` | Monocart UI test report | 7 days |
| `monocart-report-api` | `API Tests` | Monocart API test report | 7 days |
| `test-results-ui` | `UI Tests` | Traces, screenshots, and videos when retained | 7 days |
| `test-results-api` | `API Tests` | API test traces and failure artifacts when retained | 7 days |

The Pages dashboard stores Playwright and Monocart HTML reports by workflow run. The downloadable artifacts remain useful for traces, screenshots, videos, and short-term debugging.

The dashboard builder reads Monocart `index.json` files for each published run and stores summarized UI/API metrics in `runs.json`. When a new run publishes, it also backfills metrics for older runs that already have Monocart JSON files on `gh-pages`.

Local report commands:

```bash
npm run report
npm run report:monocart
```

## Failure Triage

| Failing Signal | First Check | Likely Fix |
| --- | --- | --- |
| `Typecheck` | Read TypeScript error path and line | Fix type mismatch, missing import, or invalid config. |
| `Lint` | Read ESLint rule and file | Fix rule violation or simplify the test code. |
| `Security Audit` | Run `npm audit` locally | Upgrade the affected package or document why it is deferred. |
| `UI Tests` | Open Playwright/Monocart artifact | Inspect trace, screenshot, and failing assertion. |
| `API Tests` | Check status code and response body | Verify GoREST availability, token validity, schema expectations, and generated data. |
| Authenticated CRUD skipped | Check `GOREST_API_TOKEN` secret | Add or update the GitHub repository secret. |

## Local Monitoring Commands

Run these before opening or updating a PR:

```bash
npm run typecheck
npm run lint
npm run security:audit
npm run dashboard:test
npm run test:ui
npm run test:api
```

For faster focused checks:

```bash
npm run test:smoke
npx playwright test --grep @negative
npx playwright test --grep @crud
```

## Current Limitations

- Branch protection is documented in `docs/branch-protection.md`, but it is not enabled because the private repository plan does not support it.
- GitHub Pages must be enabled from the `gh-pages` branch before the dashboard is visible.
- Published reports may be public depending on repository and Pages settings, so report content should not include secrets.
- The UI suite currently targets Chromium only.
- GoREST and SauceDemo are public external services, so availability can affect test runs.

## Improvement Ideas

- Add a retention policy if the `gh-pages` branch grows too large over time.
- Add CodeQL for deeper static analysis.
- Add cross-browser smoke coverage for Firefox and WebKit.
- Add richer report annotations for requirement IDs, severity, and test ownership.
