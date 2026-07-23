# Test strategy

Scope: REST API (auth + notes) and critical UI journeys for the Notes app.
Stack: Playwright + TypeScript in [`automation/`](../).
Product discrepancies: [KNOWN-ISSUES.md](KNOWN-ISSUES.md).

## Priorities

| Priority | Tag / meaning | CI |
| --- | --- | --- |
| **P0** | `@p0` — product unusable if broken (auth chain, notes CRUD, isolation, OpenAPI smoke) | Every **pull_request** |
| **P1** | `@p1` — supporting behavior (validation, search/sort/pagination, profile, a11y) | Full suite on **`main`** / local `npm test` |
| **P2** | Deferred / expensive (not automated as acceptance) | — |

Note: priority **P2** ≠ known-issue IDs `P1`–`P3` in [KNOWN-ISSUES.md](KNOWN-ISSUES.md) (those are pagination findings).

## API coverage

| Area | Scenarios | Priority |
| --- | --- | --- |
| Auth signup/confirm | Happy path + MailHog; duplicate verified; parameterized validation; malformed/unknown/reuse confirm | P0 / P1 |
| Auth signin / me | Valid JWT; wrong password; unverified; `/me` without / malformed / empty token | P0 |
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
| Profile | Email + id (after UI sign-in and API JWT bootstrap) | P1 |
| Notes CRUD | Create / edit / delete (+ cancel edit/delete) | P0 / P1 |
| Notes list | Search; empty/clear search; pagination known-issues; sort | P1 |
| Accessibility | axe smoke on auth + notes (known `A1`/`A2` allowlisted) | P1 |

## Engineering decisions

Detailed rationale: [ADR.md](ADR.md). Practical rules when adding tests: [CONTRIBUTING.md](../CONTRIBUTING.md).

This suite is risk-based (`@p0` first), parallel-safe (unique emails, no shared DB cleanup), API-first for UI setup, and findings-aware (assert actual behavior; document mismatches in [KNOWN-ISSUES.md](KNOWN-ISSUES.md)). CI fail-fast: `build → migrate → unit` gates `e2e (stack → api → ui)`.

## Explicitly out of scope (P2)

- Waiting full 10 minutes for expired confirmation codes
- Seeding 51+ notes for `itemsPerPage` hard cap
- Visual regression / multi-browser matrix
- `APP_MODE=broken` as acceptance
