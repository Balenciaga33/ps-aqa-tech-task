# Notes App — Test Automation (Playwright)

API and UI automated tests for the notes application.

Stack: **Playwright + TypeScript**.

Related docs:
- [Test plan](../docs/TEST-PLAN.md)
- [Findings](../docs/FINDINGS.md)

## Prerequisites

Application stack must be running from the repository root:

```sh
make up && make install && make migrate
```

If `make install` fails without a TTY:

```sh
docker run --rm -v "$(pwd):/app" -w /app composer:2.9.3 install
make migrate
```

Services used by tests:

| Service | URL |
| --- | --- |
| App UI / API | http://localhost:4444 |
| API docs | http://localhost:4444/api/doc |
| MailHog | http://localhost:8025 |

## Setup

```sh
cd automation
cp .env.example .env
npm install
npx playwright install chromium
```

Requires **Node.js 24+** (Active LTS).

Environment variables (see `.env.example`):

- `BASE_URL` — app UI base URL
- `API_URL` — API base URL (defaults to same host)
- `MAILHOG_URL` — MailHog HTTP API

## Run tests

```sh
# All tests (API + UI)
npm test

# API only
npm run test:api

# UI only
npm run test:ui

# Open HTML report
npm run test:report
```

## Structure

```
automation/
  src/
    clients/          # Auth, Notes, MailHog HTTP clients
    fixtures/         # Playwright fixtures (registeredUser, clients, app)
    helpers/          # Auth bootstrap, unique test data
    pages/            # UI page object
    types/            # Shared API types
  tests/
    api/              # API specs
    ui/               # UI E2E specs
  playwright.config.ts
```

## Priority matrix

| Priority | Meaning | Scenarios | Layer |
| --- | --- | --- | --- |
| **P0** | Product is unusable if broken | Signup → MailHog confirm → JWT; sign-in; notes CRUD; owner isolation; unauthorized access without JWT | API + UI |
| **P1** | Important, but core still works | `GET /me`; validation; search; pagination; sort; profile; cancel delete; UI list controls | API + UI |
| **P2** | Nice-to-have / out of current suite | Visual regression; multi-browser matrix; `APP_MODE=broken`; expired-code wait | — |

Current suite focuses on **P0** and selected **P1**. **P2** is intentionally deferred.

## Design decisions

- **Risk-based**: critical auth and notes flows first; no visual regression or full browser matrix (Chromium only).
- **Independent tests**: unique email per run; no shared mutable fixtures between specs.
- **Fixtures**: `registeredUser`, typed clients, `app` page object via `test.extend`.
- **API-first UI**: JWT injected into `localStorage`; notes seeded via API; browser used for the behavior under test; network waits via `waitForResponse`.
- **Findings-aware**: assert actual behavior; document OpenAPI/UI mismatches in `docs/FINDINGS.md`.
- **Healthy mode only**: tests assume `APP_MODE=healthy`.

## CI evidence

GitHub Actions (`.github/workflows/ci.yml`) pipeline:

1. **phpunit** — fast backend smoke (build image → migrate → PHPUnit)
2. **playwright** — starts only if phpunit passed (`needs: phpunit`)
   - one shared App + MailHog stack
   - `npm run test:api` first
   - `npm run test:ui` next (skipped automatically if API step failed)

Outdated runs on the same branch are cancelled via `concurrency`.

Check the repository **Actions** tab for run status. On failure (or for review), download the `playwright-report` artifact.
