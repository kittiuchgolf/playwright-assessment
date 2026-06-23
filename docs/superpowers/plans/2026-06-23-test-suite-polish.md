# Test Suite Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the assessment repository with tagged tests, safer API cleanup, split CI jobs, a README badge, and a PR template.

**Architecture:** Keep the existing Playwright fixture/client/page-object design. Add test tags in titles for simple Playwright grep usage, add cleanup safety inside the authenticated CRUD test, split the workflow into focused jobs, and document the reviewer workflow.

**Tech Stack:** TypeScript, Playwright Test, GitHub Actions.

## Global Constraints

- Keep secrets out of git.
- Keep `npm test` as the full local suite.
- Preserve existing test coverage.
- CI must still run useful checks if `GOREST_API_TOKEN` is unavailable.

---

### Task 1: Test Tags

**Files:**
- Modify: `tests/ui/auth.spec.ts`
- Modify: `tests/ui/shopping.spec.ts`
- Modify: `tests/api/users.spec.ts`
- Modify: `package.json`
- Modify: `README.md`

- [x] Add tags such as `@smoke`, `@ui`, `@api`, `@auth`, `@crud`, and `@negative`.
- [x] Add `test:smoke` script.
- [x] Document tag usage in README.

### Task 2: API Cleanup Safety

**Files:**
- Modify: `tests/api/users.spec.ts`

- [x] Track created GoREST user ID.
- [x] Delete in a `finally` block if the main test fails before explicit deletion.
- [x] Avoid masking the original test failure if cleanup also fails.

### Task 3: Split CI Jobs

**Files:**
- Modify: `.github/workflows/playwright.yml`

- [x] Split typecheck, UI tests, and API tests into separate jobs.
- [x] Upload separate UI/API report artifacts.
- [x] Keep token-free API fallback for repositories without `GOREST_API_TOKEN`.

### Task 4: Repository Polish

**Files:**
- Create: `.github/pull_request_template.md`
- Modify: `README.md`

- [x] Add GitHub Actions status badge.
- [x] Add PR test-evidence template.

### Task 5: Verification

- [x] Run `npm run typecheck`.
- [x] Run `npm run test:ui`.
- [x] Run `npm run test:api`.
- [x] Run `npm run test:smoke`.
- [ ] Push and verify GitHub Actions.
