# Notes App — Test Automation (Playwright)

API and UI automated tests for the notes application.

Stack: **Playwright + TypeScript**.

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
    helpers/          # Auth bootstrap, unique test data
    pages/            # UI page object
  tests/
    api/              # API specs
    ui/               # UI E2E specs
  playwright.config.ts
```

## Priority matrix

| Priority | Meaning | Scenarios | Layer |
| --- | --- | --- | --- |
| **P0** | Product is unusable if broken | Signup → MailHog confirm → JWT; sign-in; notes CRUD; owner isolation; unauthorized access without JWT | API + UI |
| **P1** | Important, but core still works | `GET /me`; validation (email/password/code/duplicate); search; pagination; sort; profile; delete confirm modal | API + UI |
| **P2** | Nice-to-have / out of current suite | Visual regression; multi-browser matrix; `APP_MODE=broken`; rare edge cases (expired code timing, rate limits) | — |

Current suite focuses on **P0** and selected **P1**. **P2** is intentionally deferred.

## Coverage

### API

**Auth**

- Signup → confirmation email in MailHog → confirm → JWT
- Sign-in (valid / invalid / unverified user)
- `GET /api/auth/me` with and without token
- Validation: invalid email, short password, duplicate verified user, invalid confirmation code

**Notes**

- CRUD lifecycle
- Search, pagination, sort
- Unauthorized access without JWT
- Owner isolation (user A cannot read/update/delete notes of user B)

### UI

- Sign-up → confirm via MailHog link → authenticated account
- Sign-in → notes list and profile
- Create / edit / delete note (with delete confirmation modal)
- Search smoke

## Design decisions

- **Risk-based**: critical auth and notes flows first; no visual regression or full browser matrix (Chromium only).
- **Independent tests**: unique email per run; no shared mutable fixtures between specs.
- **API first**: helpers register users and seed data via API; UI tests focus on user journeys.
- **MailHog integration**: confirmation codes/links are read from MailHog API, not hardcoded.
- **Healthy mode only**: tests assume `APP_MODE=healthy`. Broken mode intentionally mutates responses and is out of acceptance scope.

## CI evidence

GitHub Actions (`.github/workflows/ci.yml`) pipeline:

1. **phpunit** — fast backend smoke (build image → migrate → PHPUnit)
2. **playwright** — starts only if phpunit passed (`needs: phpunit`)
   - one shared App + MailHog stack
   - `npm run test:api` first
   - `npm run test:ui` next (skipped automatically if API step failed)

Outdated runs on the same branch are cancelled via `concurrency`.

Check the repository **Actions** tab for run status. On failure (or for review), download the `playwright-report` artifact.
