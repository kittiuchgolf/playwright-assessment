# CI Validation Fixtures Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the Playwright assessment with CI, runtime API schema validation, shared fixtures, and a richer non-Allure report.

**Architecture:** Keep tests under the existing `tests` tree. Add one shared Playwright fixture module for page objects, authenticated UI setup, and GoREST client setup. Add Zod schemas beside API types, configure Monocart as an additional reporter, and add GitHub Actions workflow that uploads reports and traces as artifacts.

**Tech Stack:** TypeScript, Playwright Test, Zod, Monocart Reporter, GitHub Actions.

## Global Constraints

- Keep `.env` ignored and do not commit secrets.
- Keep `npm test` as the main local entry point.
- Keep UI and API projects split in `playwright.config.ts`.
- Use a reporter other than Allure.
- Preserve existing test coverage while reducing duplicated setup.

---

### Task 1: Shared Fixtures

**Files:**
- Create: `tests/fixtures/test.ts`
- Modify: `tests/ui/auth.spec.ts`
- Modify: `tests/ui/shopping.spec.ts`
- Modify: `tests/api/users.spec.ts`

**Interfaces:**
- Produces: `test` and `expect` exports from `tests/fixtures/test.ts`.
- Produces fixtures: `loginPage`, `inventoryPage`, `cartPage`, `checkoutPage`, `loggedInInventoryPage`, `goRestClient`, `authenticatedGoRestClient`.

- [x] Create fixture module wrapping page objects and API clients.
- [x] Replace duplicated setup in UI and API specs with fixtures.
- [x] Keep explicit scenario steps in the specs.

### Task 2: API Schema Validation

**Files:**
- Create: `tests/api/schemas/user.schema.ts`
- Modify: `tests/api/types/user.ts`
- Modify: `tests/api/clients/gorest-client.ts`
- Modify: `tests/api/users.spec.ts`

**Interfaces:**
- Produces: `GoRestUserSchema`, `GoRestUserListSchema`, `GoRestErrorListSchema`.
- Produces: client validators returning typed parsed data.

- [x] Add Zod dependency.
- [x] Validate API success and error response bodies at runtime.
- [x] Keep tests focused on business assertions after schema parsing.

### Task 3: Monocart Reporter

**Files:**
- Modify: `package.json`
- Modify: `playwright.config.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: Monocart report under `monocart-report/`.

- [x] Add `monocart-reporter` dependency.
- [x] Configure Playwright reporters with list, HTML, and Monocart.
- [x] Ignore generated report output.

### Task 4: GitHub Actions CI

**Files:**
- Create: `.github/workflows/playwright.yml`

**Interfaces:**
- Produces: CI workflow for push and pull request events.

- [x] Run npm install, browser install, typecheck, and tests.
- [x] Upload Playwright report, Monocart report, and test-results artifacts.
- [x] Use `GOREST_API_TOKEN` from GitHub repository secrets.

### Task 5: Verification

**Files:**
- Modify only if verification exposes defects.

- [x] Run `npm run typecheck`.
- [x] Run `npm test`.
- [x] Confirm git status and push branch.
