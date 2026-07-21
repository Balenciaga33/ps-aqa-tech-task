# Test Plan

Scope: REST API (auth + notes) and critical UI journeys for the Notes app.
Stack: Playwright + TypeScript in [`automation/`](../).
Product discrepancies: [FINDINGS.md](FINDINGS.md).

## Priorities

| Priority | Meaning |
| --- | --- |
| **P0** | Core flows — product unusable if broken (auth chain, notes CRUD, isolation) |
| **P1** | Important supporting behavior (validation, search/sort/pagination, profile) |
| **P2** | Edge / expensive cases (deferred or documented only) |

## API coverage

| Area | Scenarios | Priority |
| --- | --- | --- |
| Auth signup/confirm | Happy path + MailHog email/code; duplicate verified user; validation | P0 / P1 |
| Auth signin / me | Valid JWT; wrong password; unverified; `/me` 401 | P0 |
| Notes CRUD | Create/read/update/delete | P0 |
| Notes security | No JWT → 401; owner isolation | P0 |
| Notes list | Search, pagination, sort | P1 |
| Notes validation | Empty title/content → 422 | P1 |

## UI coverage

| Area | Scenarios | Priority |
| --- | --- | --- |
| Onboarding | Signup → MailHog link → authenticated notes | P0 |
| Session | Sign-in; wrong password; profile | P0 / P1 |
| Notes CRUD | Create / edit / delete (+ cancel delete) | P0 / P1 |
| Notes list | Search; pagination known-issues; sort | P1 |

## Engineering decisions (vs typical suites)

- **Risk-based automation** — P0 first; P2 only when cheap.
- **Isolation** — unique email per registration; parallel-safe; no shared DB cleanup.
- **API-first UI setup** — register/confirm and seed notes via API; inject JWT into `localStorage` when the browser is only needed for the assertion under test.
- **Layered clients** — HTTP clients return responses; specs own assertions.
- **Fixtures** — `registeredUser` per test; reusable auth/notes/mailhog clients.
- **CI fail-fast** — PHPUnit gate → Playwright API → Playwright UI on one shared Compose stack (`needs` + step order + concurrency cancel).
- **Findings-aware** — assert actual behavior; document doc/code mismatches instead of hiding them.

## Explicitly out of scope (P2)

- Waiting full 10 minutes for expired confirmation codes
- Seeding 51+ notes for `itemsPerPage` hard cap
- Visual regression / multi-browser matrix
- `APP_MODE=broken` as acceptance
