# Playwright Assessment

TypeScript Playwright test suite covering UI and API automation for the provided e-commerce assessment.

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
```

Add your GoREST token to `.env`:

```bash
GOREST_API_TOKEN=your_token_here
```

Run everything:

```bash
npm test
```

Run only one layer:

```bash
npm run test:ui
npm run test:api
```

Run static TypeScript validation:

```bash
npm run typecheck
```

## Architecture

The project separates UI automation from API automation while sharing Playwright's runner, reporting, retries, traces, and configuration.

- `tests/ui/pages`: Page Object Model classes for SauceDemo screens.
- `tests/ui/*.spec.ts`: user-facing UI journeys and edge cases.
- `tests/api/clients`: reusable GoREST API client with typed request/response helpers.
- `tests/api/types`: API domain types used by the client and tests.
- `tests/support`: shared constants and environment helpers.

I chose Page Object Model for UI tests because SauceDemo has stable screens with repeated interactions: login, inventory, cart, and checkout. The tests read as business scenarios while locators remain centralized. For API tests, a small typed client keeps authentication, request creation, and response checks out of the spec body.

## UI Scenarios

1. **Standard login succeeds**: verifies the main authenticated entry point and inventory landing page.
2. **Locked out user receives an error**: covers a critical authentication edge case.
3. **Add and remove cart item**: validates cart badge state and cart item management.
4. **Checkout completes successfully**: covers a full purchase workflow from login through order confirmation.
5. **Product sorting by low-to-high price**: checks a common product browsing behavior and validates price ordering.

## API Scenarios

1. **List users**: verifies public read access, status code, and response shape.
2. **Get user details**: validates an individual resource returned from the list endpoint.
3. **Create, update, and delete user**: exercises authenticated CRUD with generated test data.
4. **Reject unauthenticated create**: confirms Bearer token enforcement for writes.
5. **Return 404 for missing user**: validates error handling for absent resources.

## Test Data and Secrets

GoREST write operations require `GOREST_API_TOKEN`. The token is loaded from `.env`, which is intentionally ignored by git. API tests generate unique email addresses at runtime so repeated runs do not conflict with existing users.

## Assumptions

- SauceDemo and GoREST are available over the public internet when tests run.
- The GoREST token has permission to create, update, and delete users.
- Chromium is enough for the assessment because the focus is automation structure rather than browser compatibility coverage.

## With More Time

- Add CI workflow with cached Playwright browsers.
- Add schema validation with a lightweight runtime validator.
- Add cross-browser UI smoke coverage after the core Chromium suite is stable.
- Add tags for smoke, regression, and destructive API tests.
