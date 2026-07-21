import { test as base, expect } from '@playwright/test';
import { AuthClient } from '../clients/auth.client';
import { MailhogClient } from '../clients/mailhog.client';
import { NotesClient } from '../clients/notes.client';
import { AuthHelper } from '../helpers/auth.helper';
import type { TestUser } from '../types/api.types';
import { AppPage } from '../pages/app.page';

type Fixtures = {
  authClient: AuthClient;
  mailhog: MailhogClient;
  notesClient: NotesClient;
  authHelper: AuthHelper;
  registeredUser: TestUser;
  app: AppPage;
};

export const test = base.extend<Fixtures>({
  authClient: async ({ request }, use) => {
    await use(new AuthClient(request));
  },

  mailhog: async ({ request }, use) => {
    await use(new MailhogClient(request));
  },

  notesClient: async ({ request }, use) => {
    await use(new NotesClient(request));
  },

  authHelper: async ({ request }, use) => {
    await use(new AuthHelper(request));
  },

  registeredUser: async ({ authHelper }, use) => {
    await use(await authHelper.registerVerifiedUser());
  },

  app: async ({ page }, use) => {
    await use(new AppPage(page));
  },
});

export { expect };

export function annotateKnownIssue(id: number, summary: string) {
  test.info().annotations.push({
    type: 'known-issue',
    description: `FINDINGS.md #${id}: ${summary}`,
  });
}
