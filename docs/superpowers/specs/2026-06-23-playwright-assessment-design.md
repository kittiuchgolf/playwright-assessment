# Playwright Assessment Design

## Goal

Build a maintainable TypeScript Playwright project that satisfies the assessment: at least four UI scenarios against SauceDemo, at least four API scenarios against GoREST, and a README that explains setup, architecture, scenario choices, and tradeoffs.

## Architecture

Use one Playwright project with two logical suites:

- UI tests under `tests/ui`, using Page Object Model classes for login, inventory, cart, and checkout screens.
- API tests under `tests/api`, using a typed `GoRestClient` wrapper and generated user data for repeatable CRUD tests.

Secrets are loaded from `.env` via `dotenv`, and `.env` is excluded from git. The project uses Playwright traces, screenshots, and HTML report output for debugging.

## Scenarios

UI scenarios cover standard login, locked-out login error, add/remove cart item, checkout completion, and product sorting. These cover authentication, shopping cart behavior, checkout flow, and browsing behavior.

API scenarios cover listing users, fetching a user, authenticated create/update/delete, unauthenticated write rejection, and missing-user 404 handling. These cover read paths, CRUD, authentication, and error handling.

## Constraints

- Use Playwright with TypeScript.
- Keep the project runnable with `npm install` and `npm test`.
- Do not commit credentials.
- Document assumptions and future improvements in README.

## Approval

User approved this design on 2026-06-23.
