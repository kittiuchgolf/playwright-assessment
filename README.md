# Playwright Assessment

[![Playwright Tests](https://github.com/kittiuchgolf/playwright-assessment/actions/workflows/playwright.yml/badge.svg)](https://github.com/kittiuchgolf/playwright-assessment/actions/workflows/playwright.yml)

TypeScript Playwright automation project covering UI and API testing for an e-commerce assessment. The suite validates SauceDemo user journeys and GoREST API behavior with CI, reporting, fixtures, page objects, typed clients, and runtime schema validation.

## Quick Start

Install dependencies and Chromium:

```bash
npm ci
npx playwright install chromium
cp .env.example .env
```

Add a GoREST token to `.env` for authenticated API CRUD tests:

```bash
GOREST_API_TOKEN=your_token_here
```

Run the full suite:

```bash
npm test
```

Run by layer:

```bash
npm run test:ui
npm run test:api
```

## Environment

| Variable | Required | Used By | Notes |
| --- | --- | --- | --- |
| `GOREST_API_TOKEN` | Required for authenticated CRUD | `tests/api/users.spec.ts` | Stored locally in `.env` and in GitHub as a repository secret. |

If `GOREST_API_TOKEN` is missing in CI, the workflow still runs token-free API tests and skips only the authenticated CRUD scenario.

## Test Commands

| Command | Purpose |
| --- | --- |
| `npm test` | Run all Playwright projects. |
| `npm run test:ui` | Run SauceDemo UI tests. |
| `npm run test:api` | Run GoREST API tests. |
| `npm run test:smoke` | Run tests tagged `@smoke`. |
| `npm run typecheck` | Run TypeScript validation with `tsc --noEmit`. |
| `npm run lint` | Run ESLint. |
| `npm run security:audit` | Run `npm audit --audit-level=high`. |
| `npm run report` | Open the Playwright HTML report. |
| `npm run report:monocart` | Open the Monocart report. |

Useful tag examples:

```bash
npx playwright test --grep @auth
npx playwright test --grep @crud
npx playwright test --grep @negative
npx playwright test --grep-invert @crud
```

## Project Structure

```text
.github/workflows/playwright.yml   GitHub Actions quality gates
docs/branch-protection.md          Branch protection setup notes
docs/monitoring-dashboard.md       CI and report monitoring dashboard
tests/api/clients                  GoREST API client
tests/api/schemas                  Zod response schemas
tests/api/types                    API domain types
tests/api/users.spec.ts            GoREST API scenarios
tests/fixtures/test.ts             Shared Playwright fixtures
tests/support                      Shared test data and env helpers
tests/ui/pages                     Page Object Model classes
tests/ui/*.spec.ts                 SauceDemo UI scenarios
```

## Architecture

The project separates UI automation from API automation while sharing Playwright's runner, configuration, reports, traces, screenshots, and videos.

UI tests use Page Object Model classes for login, inventory, cart, and checkout screens. This keeps locators and common user actions centralized while allowing specs to read as business workflows.

API tests use a small typed `GoRestClient`. The client centralizes endpoint calls and authentication headers, while specs stay focused on behavior and assertions.

Zod validates GoREST response shapes at runtime before the tests make business assertions. This catches contract drift that a status-code-only test would miss.

Fixtures in `tests/fixtures/test.ts` provide page objects, logged-in UI state, and API clients so repeated setup stays consistent across specs.

## CI Pipeline

GitHub Actions runs on:

- Pull requests targeting `main`
- Pushes to `main`
- Manual runs from the GitHub Actions **Run workflow** button

The workflow is split into focused jobs:

| Job | Purpose |
| --- | --- |
| `Typecheck` | Catches TypeScript errors before tests run. |
| `Lint` | Enforces code quality and Playwright lint rules. |
| `Security Audit` | Fails on high-severity npm audit findings. |
| `UI Tests` | Runs SauceDemo Chromium tests after static checks pass. |
| `API Tests` | Runs GoREST API tests after static checks pass. |

See [Monitoring Dashboard](docs/monitoring-dashboard.md) for CI health, GitHub Pages report history, artifact locations, and failure triage.

## Reports and Artifacts

On pull requests, CI uploads Playwright and Monocart reports as workflow artifacts. On pushes to `main`, CI also publishes a static historical dashboard to the `gh-pages` branch. After the workflow file is on the default branch, manual runs from the GitHub Actions **Run workflow** button also publish the dashboard for that run. The dashboard keeps reports by workflow run and opens with two primary choices:

- **Open Monocart report**
- **Open Playwright report**

Local test runs generate:

- `playwright-report/`: Playwright HTML report
- `monocart-report/`: Monocart report
- `test-results/`: traces, screenshots, and videos when retained

CI uploads separate artifacts for UI and API jobs:

- `playwright-report-ui`
- `playwright-report-api`
- `monocart-report-ui`
- `monocart-report-api`
- `test-results-ui`
- `test-results-api`

To publish the dashboard, configure GitHub Pages to deploy from the `gh-pages` branch at the repository root.

## Test Coverage

### UI

| Scenario | Purpose |
| --- | --- |
| Standard login succeeds | Validates the main authenticated entry point. |
| Locked-out user receives an error | Covers negative authentication behavior. |
| Add and remove cart item | Verifies cart badge and cart item state. |
| Checkout completes successfully | Covers the purchase workflow. |
| Checkout requires customer information | Covers negative checkout validation. |
| Sort products by low-to-high price | Validates product browsing behavior. |

### API

| Scenario | Purpose |
| --- | --- |
| List users | Validates public read access and list schema. |
| Get user details | Validates individual resource shape. |
| Create, update, and delete user | Exercises authenticated CRUD with generated data. |
| Reject unauthenticated create | Confirms Bearer token enforcement. |
| Return 404 for unknown user | Covers missing-resource behavior. |

## Design Decisions

- **TypeScript:** catches type errors early and improves refactoring safety.
- **Page Object Model:** centralizes UI locators and common actions.
- **Fixtures:** reduces repeated setup while keeping tests readable.
- **Runtime schemas:** validates API response contracts with Zod.
- **Generated API data:** avoids email collisions in repeated GoREST runs.
- **CI job split:** makes failures easier to diagnose.
- **Monocart reporting:** adds a readable report beside Playwright's native HTML report.
- **Dependabot:** surfaces dependency updates for review instead of relying on manual checks.

## Troubleshooting

| Symptom | Likely Cause | Fix |
| --- | --- | --- |
| Authenticated API CRUD is skipped in CI | `GOREST_API_TOKEN` secret is missing | Add repository secret `GOREST_API_TOKEN`. |
| Local API CRUD fails with 401 | `.env` token is missing or invalid | Update `.env` with a valid GoREST token. |
| Browser tests fail before launching | Chromium is not installed | Run `npx playwright install chromium`. |
| Reports do not open | No test run has generated reports yet | Run `npm test`, then `npm run report`. |
| CI shows duplicate checks | Workflow may include feature-branch `push` triggers | Keep CI limited to `pull_request` into `main` and `push` to `main`. |

## Roadmap

- Add cross-browser smoke coverage after Chromium coverage is stable.
- Add richer Monocart metadata for requirement IDs and severity.
- Enable branch protection when the GitHub plan supports it for this private repo.
- Consider CodeQL for deeper static security analysis.
