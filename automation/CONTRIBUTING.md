# Contributing to automation

Guidelines for extending the Playwright suite in this repository.

## Prerequisites

1. App stack is running (`make up && make install && make migrate` from repo root).
2. Node.js 24+.
3. From `automation/`: `npm ci && npx playwright install chromium`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm test` / `make test-e2e` | Full API + UI suite |
| `npm run test:api` / `make test-api` | API project only |
| `npm run test:ui` / `make test-ui` | UI project only |
| `npm run test:p0` / `make test-p0` | Blocker tests (`@p0`) — same filter as PR CI |
| `make test` | Product PHPUnit smoke (not Playwright) |

## How to add a test

1. Prefer **API** for contract/validation/isolation; use **UI** for user-visible journeys only.
2. Put specs under domain folders, e.g. `tests/api/auth/…`, `tests/api/notes/…`, `tests/ui/notes/…`, `tests/ui/profile/…`.
3. Tag with `{ tag: '@p0' }` or `{ tag: '@p1' }` (see [TEST-STRATEGY.md](docs/TEST-STRATEGY.md)).
4. Prefer **parameterized tables** (`for` / shared cases) for validation boundaries instead of copy-pasted tests.
5. Reuse fixtures from `src/fixtures/test.fixtures.ts` (`registeredUser`, clients, page objects).
6. Keep assertions in the spec; page objects/clients stay thin.
7. If behavior differs from OpenAPI/docs, assert actual behavior and add/update [KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md) + `annotateKnownIssue(...)`.

## Page objects

| Class | Responsibility |
| --- | --- |
| `BasePage` | navigation shell, JWT bootstrap, status |
| `AuthPage` | sign-up / sign-in forms |
| `NotesPage` | notes list/create/search/sort/pagination |
| `ProfilePage` | profile view |
| `UpdateNoteModal` / `DeleteNoteModal` | note dialogs |

Do not put `expect(...)` business assertions inside page objects (visibility waits for dialogs/navigation are OK).

## CI expectations

- Pull requests run **`build → migrate → unit`**, then Playwright **`@p0`** via **`e2e (stack → api → ui)`**.
- Pushes to `main` run the **full** Playwright suite after the same phpunit gate.
- HTML report is uploaded as `playwright-report` artifact.

## Debugging failures

1. Download the CI artifact or run `npm run test:report` locally.
2. Check traces/screenshots under `test-results/` (retained on failure).
3. For mail/confirm issues, open MailHog at http://localhost:8025.
4. Confirm `APP_MODE=healthy` in the app environment.
