# Traceability Matrix

Maps assessment requirements to the implemented tests and supporting design choices. Reflects the suite currently on `main`.

## Requirement Coverage

| Assessment Requirement | Implementation | Evidence |
| --- | --- | --- |
| Use Playwright with TypeScript | Playwright Test project with TypeScript config | `playwright.config.ts`, `tsconfig.json`, `package.json` |
| Provide multiple UI scenarios | 9 UI scenarios across auth, session, cart, checkout, and catalog | `tests/ui/auth.spec.ts`, `tests/ui/shopping.spec.ts` |
| Provide multiple API scenarios | 6 API scenarios across read, CRUD, auth, validation, and not-found | `tests/api/users.spec.ts` |
| Test login/authentication | Standard login and locked-out user error | `standard user can log in and land on inventory`, `locked out user sees a clear login error` |
| Test session handling | Unauthenticated deep-link to a protected route is blocked and redirected to login | `unauthenticated user cannot deep-link into inventory` |
| Test shopping cart behavior | Add then remove a cart item | `user can add and remove an item from the cart` |
| Test checkout workflow | Successful checkout plus required-field validation | `user can complete checkout for selected products`, checkout validation tests |
| Test product browsing/filtering | Price sorting low-to-high | `user can sort products by price from low to high` |
| Use SauceDemo | UI project base URL points to SauceDemo | `playwright.config.ts` |
| Use GoREST API | API project base URL points to GoREST `/public/v2` | `playwright.config.ts` |
| Cover CRUD operations | Create, update, delete, and verify deleted user | `creates, updates, and deletes a user with bearer token auth` |
| Cover API error handling | Unauthenticated create (401), invalid email (422), unknown user (404) | `rejects unauthenticated user creation`, `rejects user creation with an invalid email`, `returns not found for an unknown user id` |
| Use reusable API client classes | `GoRestClient` wraps requests, auth headers, and response validation | `tests/api/clients/gorest-client.ts` |
| Use TypeScript API types | User payload and response types derived from schemas | `tests/api/types/user.ts` |
| Validate API responses | Zod runtime schemas parse user and error responses | `tests/api/schemas/user.schema.ts` |
| Handle authentication securely | GoREST token loaded from `.env` (dotenv) or GitHub secret; CRUD and 422 tests skip when absent | `.env.example`, `playwright.config.ts`, `tests/fixtures/test.ts`, `.github/workflows/playwright.yml` |
| Never commit credentials | `.env` ignored by git | `.gitignore` |
| Demonstrate maintainable UI architecture | Page Object Model plus Playwright fixtures | `tests/ui/pages/*`, `tests/fixtures/test.ts` |
| Demonstrate scalable test execution | Tagged tests and split CI jobs | `@smoke`, `@ui`, `@api`, `.github/workflows/playwright.yml` |
| Manage test data safely | Generated unique API users plus cleanup safety | `tests/api/user-data.ts`, CRUD test `try/finally` cleanup |
| Include reports | Playwright HTML and Monocart reports, plus a published history dashboard | `playwright.config.ts`, `docs/monitoring-dashboard.md` |
| Include quality gates | Typecheck, lint, security audit, UI tests, API tests | `.github/workflows/playwright.yml` |
| Explain setup and decisions | README documents setup, architecture, scenarios, CI, tags, reports | `README.md` |

## UI Scenario Matrix

| Scenario | Type | Tags | Purpose |
| --- | --- | --- | --- |
| Standard login succeeds | Positive | `@smoke @ui @auth` | Confirms valid authentication and landing page |
| Locked-out user sees error | Negative | `@ui @auth @negative` | Confirms authentication error handling |
| Unauthenticated deep-link is blocked | Negative | `@ui @auth @negative @session` | Confirms protected routes require a session |
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
| Reject unauthenticated create | Negative | `@api @negative` | Confirms auth enforcement (401) |
| Reject create with invalid email | Negative | `@api @negative @crud` | Confirms field-level validation (422) |
| Unknown user returns 404 | Negative | `@api @negative` | Confirms not-found error behavior |

## Notes

- The CRUD lifecycle and invalid-email (422) tests require `GOREST_API_TOKEN` (both create users). Without the token they skip rather than fail, so a fresh `npm install && npm test` stays green; set the token locally or as a CI secret to exercise authenticated write paths.
