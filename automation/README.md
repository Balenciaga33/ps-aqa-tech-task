# Automated tests (Playwright)

API and UI end-to-end tests for the notes application.

## Prerequisites

Application stack must be running (from repository root):

```sh
make up && make install && make migrate
```

Services used by tests:
- App UI / API: http://localhost:4444
- MailHog UI: http://localhost:8025

## Setup

```sh
cd automation
cp .env.example .env
npm install
npx playwright install chromium
```

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

Tests create unique users per run and read confirmation emails from MailHog.
