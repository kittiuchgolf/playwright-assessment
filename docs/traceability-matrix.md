# Traceability Matrix

This matrix maps the assessment requirements to the implemented tests and supporting design choices.

## Requirement Coverage

| Assessment Requirement | Implementation | Evidence |
| --- | --- | --- |
| Use Playwright with TypeScript | Playwright Test project with TypeScript config | `playwright.config.ts`, `tsconfig.json`, `package.json` |
| Provide at least 4 UI scenarios | 5 UI scenarios covering auth, cart, checkout, and catalog sorting | `tests/ui/auth.spec.ts`, `tests/ui/shopping.spec.ts` |
| Provide at least 4 API scenarios | 5 API scenarios plus 2 API client retry behavior tests | `tests/api/users.spec.ts`, `tests/api/clients/gorest-client.spec.ts` |
| Test login/authentication | Standard user login and locked-out user error | `standard user can log in and land on inventory`, `locked out user sees a clear login error` |
| Test shopping cart behavior | Add/remove cart item | `user can add and remove an item from the cart` |
| Test checkout workflow | Successful checkout and required-field validation | `user can complete checkout for selected products`, checkout validation tests |
| Test product browsing/filtering | Price sorting low-to-high | `user can sort products by price from low to high` |
| Use SauceDemo | UI project base URL points to SauceDemo | `playwright.config.ts` |
| Use GoREST API | API project base URL points to GoREST `/public/v2` | `playwright.config.ts` |
| Cover CRUD operations | Create, update, delete, and verify deleted user | `creates, updates, and deletes a user with bearer token auth` |
| Cover API error handling | Unauthenticated create and unknown user 404 | `rejects unauthenticated user creation`, `returns not found for an unknown user id` |
| Use reusable API client classes | `GoRestClient` wraps all API requests, auth headers, validation, and retries | `tests/api/clients/gorest-client.ts` |
| Use TypeScript API types | User payload and response types are defined from schemas | `tests/api/types/user.ts` |
| Validate API responses | Zod runtime schemas parse user and error responses | `tests/api/schemas/user.schema.ts` |
| Handle authentication securely | GoREST token is loaded from `.env` or GitHub secret | `.env.example`, `tests/support/env.ts`, `.github/workflows/playwright.yml` |
| Never commit credentials | `.env` ignored by git | `.gitignore` |
| Demonstrate maintainable UI architecture | Page Object Model plus Playwright fixtures | `tests/ui/pages/*`, `tests/fixtures/test.ts` |
| Demonstrate scalable test execution | Tagged tests and split CI jobs | `@smoke`, `@ui`, `@api`, `.github/workflows/playwright.yml` |
| Include reports | Playwright HTML and Monocart reports | `playwright.config.ts` |
| Include quality gates | Typecheck, lint, security audit, UI tests, API tests | `.github/workflows/playwright.yml` |
| Handle transient API instability | GoREST client retries known transient transport errors only | `GoRestClient.withTransientRetry`, `gorest-client.spec.ts` |
| Manage test data safely | Generated unique API users and cleanup safety | `tests/api/user-data.ts`, CRUD test `try/finally` cleanup |
| Explain setup and decisions | README documents setup, architecture, scenarios, CI, tags, reports | `README.md` |

## UI Scenario Matrix

| Scenario | Type | Tags | Purpose |
| --- | --- | --- | --- |
| Standard login succeeds | Positive | `@smoke @ui @auth` | Confirms valid authentication and landing page |
| Locked-out user sees error | Negative | `@ui @auth @negative` | Confirms authentication error handling |
| Add/remove cart item | Positive | `@smoke @ui @cart` | Confirms cart state and item removal |
| Complete checkout | Positive | `@smoke @ui @checkout` | Confirms end-to-end purchase flow |
| Missing checkout first name | Negative | `@ui @checkout @negative` | Confirms checkout validation |
| Missing checkout last name | Negative | `@ui @checkout @negative` | Confirms checkout validation |
| Missing checkout postal code | Negative | `@ui @checkout @negative` | Confirms checkout validation |
| Sort products by price | Positive | `@ui @catalog` | Confirms product browsing behavior |

## API Scenario Matrix

| Scenario | Type | Tags | Purpose |
| --- | --- | --- | --- |
| List users | Positive | `@smoke @api` | Confirms public read endpoint and response schema |
| Get user details | Positive | `@api` | Confirms individual resource retrieval |
| Create/update/delete user | Positive CRUD | `@smoke @api @crud` | Confirms authenticated write lifecycle |
| Reject unauthenticated create | Negative | `@api @negative` | Confirms auth enforcement |
| Unknown user returns 404 | Negative | `@api @negative` | Confirms not-found error behavior |
| Retry transient request failure | Resilience | `@api` | Confirms temporary transport errors are retried |
| Do not retry non-transient failure | Resilience | `@api` | Confirms real request failures are not hidden |
