# Findings: documented / expected vs actual behavior

Discrepancies found while designing and running the automated suite.
Tests assert **actual** behavior and reference these items via `test.info().annotations` / comments where relevant, so CI stays green while findings stay visible.

## 1. `POST /api/auth/confirm` returns 201 instead of documented 200

- **Documented:** `200` in OpenAPI (`/api/doc.json`)
- **Actual:** `201 Created` (`AuthController::confirm`)
- **Impact:** Strict clients expecting 200 may mis-handle success
- **Covered by:** API auth confirm happy-path (accepts 201; annotated)

## 2. Unauthenticated notes access returns 401 instead of documented 403

- **Documented:** `403` for `/api/notes*` without auth
- **Actual:** `401` from the JWT firewall before API Platform authorization
- **Impact:** Spec should be updated; 401 is semantically reasonable for missing token
- **Covered by:** API notes unauthorized access tests

## 3. `PUT /api/notes/{id}` resets `created_at`

- **Expected:** `created_at` immutable; only `updated_at` changes
- **Actual:** after PUT, `created_at` is rewritten to "now" (entity lifecycle on replace semantics)
- **Impact:** creation history is lost on every update
- **Covered by:** API notes CRUD (asserts update fields; documents that created_at is not stable)

## 4. List endpoint returns a bare JSON array (no total count)

- **Expected (Hydra-style):** collection metadata such as `hydra:totalItems` for pagination UX
- **Actual:** plain JSON array when `Accept: application/json`
- **Impact:** UI cannot show reliable totals / last-page detection (see #5–#6)
- **Covered by:** API pagination tests + UI pagination known-issue

## 5. UI notes counter shows page slice size, not real total

- **Expected:** with 7 notes and page size 5 → `7 notes`, `Page 1 / 2`
- **Actual:** first page often shows `5 notes` and incomplete page info until later navigation
- **Where:** `public/assets/app.js` `refreshNotes()` falls back to current payload length
- **Covered by:** UI pagination spec (known-issue)

## 6. Next stays enabled on a full last page

- **Expected:** exact multiple of page size → Next disabled
- **Actual:** Next enabled; clicking yields an empty next page
- **Root cause:** same as #4/#5 — heuristic `length >= pageSize`
- **Covered by:** UI pagination spec (known-issue)

## Observation: `APP_MODE=broken`

Intentional chaos mode randomizes status codes / payload keys / confirmation links and blanks note content.
The suite targets `APP_MODE=healthy` only. Strict contract assertions would catch accidental broken mode.
