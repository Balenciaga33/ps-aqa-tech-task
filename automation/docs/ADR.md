# Architecture decision records (ADR)

Short ADRs for the automation suite. Scope lives in [TEST-STRATEGY.md](TEST-STRATEGY.md); product quirks in [KNOWN-ISSUES.md](KNOWN-ISSUES.md).

## Why Playwright + TypeScript for both API and UI

One toolchain covers HTTP contracts and browser journeys, shares MailHog helpers, and produces a single HTML report/artifact. Splitting stacks (e.g. RestAssured + Cypress) would add setup cost without value at this product size.

## Why not treat `APP_MODE=broken` as acceptance

Broken mode intentionally randomizes statuses and payloads. Acceptance tests lock the **healthy** contract. Strict assertions would fail loudly if broken mode were enabled by mistake — that is enough safety without flaky “chaos” suites.

## Why PHPUnit gates Playwright in CI

PHPUnit is a cheap smoke that the product already shipped. Failing it means the app image/DB path is broken — spending minutes on Compose + Chromium would waste CI. Playwright runs only after that gate (`needs: phpunit`), then **API before UI** on one shared stack.

## Why `@p0` on pull requests and full suite on `main`

PR feedback should be fast and focused on blockers (auth, CRUD, isolation). Full P1 coverage (search/sort/pagination nuances, known-issue UI cases) runs on `main` / full local runs so merges still get deep signal without slowing every push.

## Why API-first UI setup

Register/confirm and seed data via API, inject JWT into `localStorage`, and drive the browser only for the behavior under test. This keeps UI runtime low and avoids re-testing the signup email path in every notes scenario.

## Why findings are annotated, not forced red

Documented vs actual mismatches (see KNOWN-ISSUES.md) are product/spec issues. Tests assert **actual** behavior and carry `known-issue` annotations so CI stays a reliable merge gate while issues remain visible to reviewers.

## Why Zod schemas on critical API responses

Status codes alone miss silent contract drift (renamed fields, wrong types). Zod parses signup/confirm/signin/`/me`/note payloads on P0 paths so shape regressions fail fast with a readable path/message.

## Why axe a11y smoke (with known-issue allowlist)

A short axe run on auth + notes surfaces accessibility debt without owning a full WCAG audit. Serious/critical rules outside the KNOWN-ISSUES allowlist still fail; known product issues (`A1` color-contrast, `A2` missing `lang`) are annotated so reviewers see them and CI stays green.

## Why OpenAPI contract smoke

`/api/doc.json` is the published contract reviewers compare against. A cheap P0 smoke asserts critical paths/methods exist and documents success/unauth codes — then links known drift (C1 confirm 201 vs 200, C2 notes 401 vs 403) instead of silently diverging from the spec.
