# Engineering decisions

Short ADRs for the automation suite. Full priorities live in [TEST-PLAN.md](TEST-PLAN.md); product quirks in [FINDINGS.md](FINDINGS.md).

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

Documented vs actual mismatches (see FINDINGS.md) are product/spec issues. Tests assert **actual** behavior and carry `known-issue` annotations so CI stays a reliable merge gate while findings remain visible to reviewers.
