# Monitoring Dashboard

This dashboard explains how project health is monitored through GitHub Actions, Playwright reports, Monocart reports, and local verification commands.

## Health Overview

| Area | Signal | Source | Expected State |
| --- | --- | --- | --- |
| Build quality | TypeScript compiles | `Typecheck` CI job | Passing |
| Code quality | ESLint rules pass | `Lint` CI job | Passing |
| Dependency risk | High-severity audit findings absent | `Security Audit` CI job | Passing |
| UI behavior | SauceDemo scenarios pass | `UI Tests` CI job | Passing |
| API behavior | GoREST scenarios pass | `API Tests` CI job | Passing |
| Run summary | Job summaries include test counts | GitHub Actions summary panel | Available inside each job |
| Reports | HTML and Monocart artifacts uploaded | GitHub Actions artifacts | Available after each test job |

## CI Quality Gates

GitHub Actions runs on pull requests targeting `main` and pushes to `main`.

| Job | Command | Blocks Later Jobs | What It Protects |
| --- | --- | --- | --- |
| `Typecheck` | `npm run typecheck` | Yes | Prevents TypeScript errors from reaching test jobs. |
| `Lint` | `npm run lint` | Yes | Keeps code style and Playwright usage consistent. |
| `Security Audit` | `npm run security:audit` | Yes | Fails on high-severity npm dependency issues. |
| `UI Tests` | `npm run test:ui` | No | Validates user-facing SauceDemo workflows. |
| `API Tests` | `npm run test:api` or token-free fallback | No | Validates GoREST API behavior and schemas. |

The UI and API jobs wait for static checks first. This saves runtime because browser/API tests do not run when the code already fails typecheck, lint, or audit.

## GitHub Actions Job Summaries

Each workflow job writes a Markdown summary to `$GITHUB_STEP_SUMMARY`.

| Job | Summary Includes |
| --- | --- |
| `Typecheck` | Command, outcome, and purpose. |
| `Lint` | Command, outcome, and linting purpose. |
| `Security Audit` | Command, outcome, and security purpose. |
| `UI Tests` | Command, total, passed, failed, flaky, skipped, duration, browser, and UI artifact names. |
| `API Tests` | Command, total, passed, failed, flaky, skipped, duration, token availability, selected API suite outcome, and API artifact names. |

Use the job summary for a quick health check. Use Playwright and Monocart artifacts when a failure needs trace, screenshot, video, or detailed step inspection.

Flaky means Playwright had to retry a test and the final retry passed. It does not include request-level retries inside helper code.

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

The CI summary counts are generated from `test-results/playwright-results.json`, not from terminal output.

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
- Reports are stored as workflow artifacts, not published as a permanent static site.
- The UI suite currently targets Chromium only.
- GoREST and SauceDemo are public external services, so availability can affect test runs.

## Improvement Ideas

- Publish the Monocart report to GitHub Pages if the repository visibility and workflow permissions allow it.
- Add CodeQL for deeper static analysis.
- Add cross-browser smoke coverage for Firefox and WebKit.
- Add richer report annotations for requirement IDs, severity, and test ownership.
