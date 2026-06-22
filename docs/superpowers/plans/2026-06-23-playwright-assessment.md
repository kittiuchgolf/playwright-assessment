# Playwright Assessment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable TypeScript Playwright UI and API automation assessment project.

**Architecture:** Use Playwright Test with separate UI and API projects. UI tests use Page Object Model classes. API tests use a typed GoREST client and generated test data.

**Tech Stack:** TypeScript, Playwright Test, dotenv, Node.js, GoREST, SauceDemo.

## Global Constraints

- Use Playwright with TypeScript.
- Implement at least 4 UI scenarios and 4 API scenarios.
- Keep secrets in `.env`; never commit credentials.
- `npm test` must run the suite.
- README must explain setup, architecture, scenarios, assumptions, and future improvements.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `playwright.config.ts`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `README.md`

**Interfaces:**
- Produces: npm scripts `test`, `test:ui`, `test:api`, `typecheck`.
- Produces: Playwright projects `ui-chromium` and `api`.

- [x] Create Playwright TypeScript project configuration.
- [x] Configure dotenv loading and split UI/API projects.
- [x] Document install and run commands.

### Task 2: UI Page Objects and Tests

**Files:**
- Create: `tests/support/users.ts`
- Create: `tests/ui/pages/login.page.ts`
- Create: `tests/ui/pages/inventory.page.ts`
- Create: `tests/ui/pages/cart.page.ts`
- Create: `tests/ui/pages/checkout.page.ts`
- Create: `tests/ui/auth.spec.ts`
- Create: `tests/ui/shopping.spec.ts`

**Interfaces:**
- Consumes: Playwright `Page` and SauceDemo credentials.
- Produces: maintainable UI workflows for login, cart, checkout, and sorting.

- [x] Add central SauceDemo test users.
- [x] Add page objects with stable `data-test` locators and role locators.
- [x] Add login success and locked-out error tests.
- [x] Add cart, checkout, and sorting tests.

### Task 3: API Client and Tests

**Files:**
- Create: `tests/support/env.ts`
- Create: `tests/api/types/user.ts`
- Create: `tests/api/clients/gorest-client.ts`
- Create: `tests/api/user-data.ts`
- Create: `tests/api/users.spec.ts`

**Interfaces:**
- Consumes: `GOREST_API_TOKEN`.
- Produces: `GoRestClient` methods `listUsers`, `getUser`, `createUser`, `updateUser`, `deleteUser`.

- [x] Add typed GoREST user models.
- [x] Add reusable API client with auth headers and response validators.
- [x] Add unique test user data generation.
- [x] Add list, get, CRUD, unauthenticated, and 404 tests.

### Task 4: Verification

**Files:**
- Modify only if verification exposes defects.

**Interfaces:**
- Consumes: npm scripts and external test sites.
- Produces: passing typecheck and Playwright suite.

- [x] Run `npm install`.
- [x] Run `npx playwright install chromium`.
- [x] Create local `.env` with the provided GoREST token.
- [x] Run `npm run typecheck`.
- [x] Run `npm test`.
- [x] Fix any failures and rerun relevant checks.
