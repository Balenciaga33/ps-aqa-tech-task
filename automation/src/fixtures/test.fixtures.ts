import { test as base, expect } from '@playwright/test';
import { AuthClient } from '../clients/auth.client';
import { MailhogClient } from '../clients/mailhog.client';
import { NotesClient } from '../clients/notes.client';
import { AuthHelper } from '../helpers/auth.helper';
import type { TestUser } from '../types/api.types';
import { AuthPage } from '../pages/auth.page';
import { NotesPage } from '../pages/notes.page';
import { ProfilePage } from '../pages/profile.page';

type Fixtures = {
  authClient: AuthClient;
  mailhog: MailhogClient;
  notesClient: NotesClient;
  authHelper: AuthHelper;
  registeredUser: TestUser;
  authPage: AuthPage;
  notesPage: NotesPage;
  profilePage: ProfilePage;
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

  authPage: async ({ page }, use) => {
    await use(new AuthPage(page));
  },

  notesPage: async ({ page }, use) => {
    await use(new NotesPage(page));
  },

  profilePage: async ({ page }, use) => {
    await use(new ProfilePage(page));
  },
});

export { expect };

export function annotateKnownIssue(id: number, summary: string) {
  test.info().annotations.push({
    type: 'known-issue',
    description: `FINDINGS.md #${id}: ${summary}`,
  });
}
