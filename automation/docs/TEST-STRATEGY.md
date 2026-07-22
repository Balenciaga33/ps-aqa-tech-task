# Test strategy

Scope: REST API (auth + notes) and critical UI journeys for the Notes app.
Stack: Playwright + TypeScript in [`automation/`](../).
Product discrepancies: [KNOWN-ISSUES.md](KNOWN-ISSUES.md).

## Priorities

| Priority | Meaning |
| --- | --- |
| **P0** | Core flows — product unusable if broken (auth chain, notes CRUD, isolation) |
| **P1** | Important supporting behavior (validation, search/sort/pagination, profile) |
| **P2** | Edge / expensive cases (deferred or documented only) |

## API coverage

| Area | Scenarios | Priority |
| --- | --- | --- |
| Auth signup/confirm | Happy path + MailHog; duplicate verified; parameterized validation; malformed/unknown/reuse confirm | P0 / P1 |
| Auth signin / me | Valid JWT; wrong password; unverified; `/me` without/malformed token | P0 |
| Notes CRUD | Create/read/update/delete; missing id → 404 | P0 / P1 |
| Notes security | No JWT → 401; owner isolation | P0 |
| Notes list | Search `q`; field filters `title`/`content`; pagination; sort | P1 |
| Notes validation | Parameterized empty/boundary title & content; title trim; whitespace content quirk (`D2`); invalid JSON; JSON-LD Accept `500` (`C3`) | P1 |
| API contracts | Zod on P0 responses; OpenAPI smoke on `/api/doc.json` (paths + documented statuses; C1/C2 drift annotated) | P0 |

## UI coverage

| Area | Scenarios | Priority |
| --- | --- | --- |
| Onboarding | Signup → MailHog link → authenticated notes; invalid confirm link; HTML5 signup blocks | P0 / P1 |
| Session | Sign-in; wrong password; unverified; sign-out; protected route without JWT | P0 / P1 |
| Profile | Email + id after sign-in | P1 |
| Notes CRUD | Create / edit / delete (+ cancel edit/delete) | P0 / P1 |
| Notes list | Search; empty/clear search; pagination known-issues; sort | P1 |
| Accessibility | axe smoke on auth + notes (known `A1`/`A2` allowlisted) | P1 |

## Engineering decisions (vs typical suites)

- **Risk-based automation** — P0 first; P2 only when cheap.
- **Isolation** — unique email per registration; parallel-safe; no shared DB cleanup.
- **API-first UI setup** — register/confirm and seed notes via API; inject JWT into `localStorage` when the browser is only needed for the assertion under test.
- **Layered clients** — HTTP clients return responses; specs own assertions.
- **Fixtures** — `registeredUser` per test; reusable auth/notes/mailhog clients.
- **CI fail-fast** — `build → migrate → unit` gates `e2e (stack → api → ui)` (`needs` + step order + concurrency cancel).
- **Findings-aware** — assert actual behavior; document doc/code mismatches instead of hiding them.

## Explicitly out of scope (P2)

- Waiting full 10 minutes for expired confirmation codes
- Seeding 51+ notes for `itemsPerPage` hard cap
- Visual regression / multi-browser matrix
- `APP_MODE=broken` as acceptance
