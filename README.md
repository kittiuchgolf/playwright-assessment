# Playwright Assessment

[![Playwright Tests](https://github.com/kittiuchgolf/playwright-assessment/actions/workflows/playwright.yml/badge.svg)](https://github.com/kittiuchgolf/playwright-assessment/actions/workflows/playwright.yml)

End-to-end UI and API test automation in TypeScript with Playwright. UI scenarios run against [SauceDemo](https://www.saucedemo.com/); API scenarios run against the [GoREST](https://gorest.co.in/) REST API. The suite uses Page Objects, a typed API client, runtime schema validation (Zod), tagged tests, and a CI pipeline with quality gates.

## Quick Start

```bash
npm install
cp .env.example .env   # optional: add a GoREST token for authenticated API tests
npm test
```

Chromium installs automatically before UI test commands. The authenticated CRUD and invalid-email (422) tests require `GOREST_API_TOKEN` in `.env` (or a CI secret); without it they skip, so a fresh `npm test` is green out of the box. Run one layer with `npm run test:ui` or `npm run test:api`.

## Test Commands

| Command | Purpose |
| --- | --- |
| `npm test` | Run all projects (UI + API). |
| `npm run test:ui` / `npm run test:api` | Run a single layer. |
| `npm run test:smoke` | Run `@smoke`-tagged tests. |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint static checks. |
| `npm run security:audit` | `npm audit --audit-level=high`. |
| `npm run report` | Open the Playwright HTML report. |

Filter by tag, e.g. `npx playwright test --grep @negative` or `--grep-invert @crud`.

## Test Coverage

### UI (SauceDemo)

| Scenario | Purpose |
| --- | --- |
| Standard login succeeds | Validates the main authenticated entry point. |
| Locked-out user sees an error | Covers negative authentication behavior. |
| Unauthenticated deep-link is blocked | Covers session handling — a protected route redirects to login. |
| Add and remove a cart item | Verifies cart badge and item state. |
| Checkout completes successfully | Covers the purchase workflow. |
| Checkout requires customer information | Covers checkout field validation. |
| Sort products by price (low to high) | Validates product browsing behavior. |

### API (GoREST)

| Scenario | Purpose |
| --- | --- |
| List users | Public read access and list schema. |
| Get user details | Individual resource shape. |
| Create, update, and delete a user | Authenticated CRUD with generated data. |
| Reject unauthenticated create | Bearer token enforcement (401). |
| Reject create with an invalid email | Field-level validation (422). |
| Return 404 for an unknown user | Missing-resource behavior. |

## Design & Architecture

- **Page Object Model** — `tests/ui/pages/*` centralize locators and actions, so specs read as business workflows.
- **Typed API client** — `GoRestClient` wraps endpoints, auth headers, and response handling in one place.
- **Runtime schema validation** — Zod parses GoREST responses, catching contract drift a status-code-only check would miss.
- **Fixtures** — `tests/fixtures/test.ts` provide page objects, a logged-in UI state, and API clients to keep setup consistent.
- **Safe test data** — unique generated users plus `try/finally` cleanup avoid collisions and leftover records.
- **Tagged, split CI** — `@smoke`/`@ui`/`@api`/`@negative` tags and separate CI jobs make runs selective and failures easy to localize.
- **Secret handling** — the GoREST token comes only from `.env` or a CI secret; `.env` is gitignored.

## Project Structure

```text
tests/ui/*.spec.ts        SauceDemo UI scenarios
tests/ui/pages            Page Object Model classes
tests/api/users.spec.ts   GoREST API scenarios
tests/api/clients         Typed GoREST client
tests/api/schemas         Zod response schemas
tests/api/types           API domain types
tests/fixtures            Shared Playwright fixtures
tests/support             Shared test data
.github/workflows         CI pipeline
```

## CI

GitHub Actions runs on pull requests to `main` and pushes to `main`. Static gates (Typecheck, Lint, Security Audit) run first; the UI and API test jobs run only after they pass. Reports upload as build artifacts, and a run-history dashboard publishes to GitHub Pages (`gh-pages`).

## Reports

`npm test` generates a Playwright HTML report (`playwright-report/`) and a Monocart report (`monocart-report/`) — open them with `npm run report` and `npm run report:monocart`. Failing tests retain traces, screenshots, and video under `test-results/`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Authenticated API tests skipped | Set `GOREST_API_TOKEN` in `.env` (skipping is expected without it). |
| API returns 401 | Token missing or expired — update `.env` or the CI secret. |
| Browser fails to launch | Run `npx playwright install chromium`. |

## Possible Extensions

- Cross-browser smoke coverage (Firefox, WebKit).
- Requirement-ID and severity metadata in reports.
- CodeQL for deeper static analysis.
