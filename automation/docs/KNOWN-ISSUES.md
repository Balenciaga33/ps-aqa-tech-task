# Known product issues

Issues caught while building this Playwright suite against `APP_MODE=healthy`.
We assert **what the app actually does**, keep CI green, and attach Playwright
`known-issue` annotations that point at the IDs below.

IDs are stable (`C*`, `D*`, `P*`, `A*`) so annotations survive reordering inside a section.
Do not confuse issue IDs `P1`–`P3` (pagination) with priority tag **P2** (deferred scope in TEST-STRATEGY).

---

## Contract drift (OpenAPI ↔ runtime)

### C1 — Email confirm succeeds with `201`, not documented `200`

| | |
| --- | --- |
| OpenAPI | `POST /api/auth/confirm` → `200` |
| Runtime | `201 Created` from `AuthController::confirm` |
| Risk | Strict HTTP clients may reject a successful confirm |
| Evidence | `tests/api/auth/signup.spec.ts` (happy-path) + Zod `tokenResponseSchema`; annotation `C1` |

### C2 — Missing JWT on notes is `401`, not documented `403`

| | |
| --- | --- |
| OpenAPI | unauthenticated `/api/notes*` → `403` |
| Runtime | Symfony JWT firewall answers `401` before API Platform authz |
| Risk | Spec is wrong more than the security behavior; prefer updating the doc |
| Evidence | `tests/api/notes/notes-access.spec.ts`; annotation `C2` |

### C3 — `Accept: application/ld+json` crashes list notes with `500`

| | |
| --- | --- |
| Expected | `406 Not Acceptable` (or a documented JSON-LD collection) when the negotiated format is unsupported |
| Runtime | `GET /api/notes` with `Accept: application/ld+json` → **500** HTML: “Serialization for the format jsonld is not supported” |
| Risk | Content negotiation failure looks like a server outage to API clients |
| Evidence | `tests/api/notes/notes-validation.spec.ts`; annotation `C3` |

---

## Data integrity

### D1 — Updating a note rewrites `created_at`

| | |
| --- | --- |
| Expected | `created_at` fixed at create; only `updated_at` moves |
| Runtime | `PUT /api/notes/{id}` yields a new `created_at` (“now”) |
| Risk | Creation history is silently lost on every edit |
| Evidence | `tests/api/notes/notes-crud.spec.ts` (Zod `noteSchema`; immutability not asserted); annotation `D1` |

### D2 — Note `content` accepts whitespace-only values (title does not)

| | |
| --- | --- |
| Expected | Same “required / non-blank” rules for title and content (title already trims + rejects `"   "`) |
| Runtime | `content: "   "` (or tabs/newlines) creates a note with **201** and stores the blank-looking string; content is also **not trimmed** (`"  hello  "` stays padded) |
| Risk | “Empty” notes slip through UI/API while title validation looks strict |
| Evidence | `tests/api/notes/notes-validation.spec.ts`; annotation `D2` |

---

## Pagination cascade (API gap → UI symptoms)

Root cause is shared: list responses are a **bare JSON array** (no collection total),
so the SPA cannot know the real catalog size.

### P1 — `GET /api/notes` has no total metadata

| | |
| --- | --- |
| Expected | Collection total (`hydra:totalItems`, header, or equivalent) |
| Runtime | Plain `Note[]` for `Accept: application/json` |
| Risk | Any client-side pager must guess |
| Evidence | `tests/api/notes/notes-list.spec.ts`; annotation `P1` |

### P2 — Notes counter reflects the current page, not the catalog

| | |
| --- | --- |
| Example | 7 notes, page size 5 → UI often shows `5 notes` on page 1 |
| Where | `public/assets/app.js` `refreshNotes()` uses payload length |
| Depends on | `P1` |
| Evidence | `tests/ui/notes/notes-pagination.spec.ts`; annotation `P2` |

### P3 — “Next” stays clickable on a full final page

| | |
| --- | --- |
| Example | Exactly 5 notes, page size 5 → Next enabled → empty page 2 |
| Where | Same heuristic: `length >= pageSize` ⇒ assume another page |
| Depends on | `P1` |
| Evidence | `tests/ui/notes/notes-pagination.spec.ts`; annotation `P3` |

---

## Accessibility (axe smoke)

Scanned auth + notes surfaces with `@axe-core/playwright` (WCAG 2 A/AA tags).
Serious/critical rules **outside** this allowlist still fail the suite.

### A1 — Primary button contrast below WCAG AA

| | |
| --- | --- |
| Rule | axe `color-contrast` (serious) |
| Detail | `#fffaf6` on `#b8743f` ≈ 3.61:1 (need ≥ 4.5:1) |
| Evidence | `tests/ui/a11y/a11y.spec.ts`; annotation `A1` |

### A2 — Document language not declared

| | |
| --- | --- |
| Rule | axe `html-has-lang` (serious) |
| Detail | `<html>` has no `lang` |
| Evidence | `tests/ui/a11y/a11y.spec.ts`; annotation `A2` |

---

## Environment note (not a product defect)

`APP_MODE=broken` intentionally mutates statuses, payload keys, confirm links, and note content.
This suite only targets **healthy**. Zod contracts + exact UI waits are meant to fail loudly if broken mode is left on by mistake.
