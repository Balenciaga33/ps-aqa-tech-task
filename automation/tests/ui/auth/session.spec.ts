import { test, expect } from '../../../src/fixtures/test.fixtures';
import { TOKEN_KEY } from '../../../src/pages/base.page';

test.describe('UI Auth / session', () => {
  test('sign out returns to auth and protected route requires session', { tag: '@p1' }, async ({
    notesPage,
    page,
    registeredUser,
  }) => {
    // Set token once (not via addInitScript) so logout + reload stay guest.
    await page.goto('/');
    await page.evaluate(
      ([key, token]) => localStorage.setItem(key, token),
      [TOKEN_KEY, registeredUser.token] as [string, string],
    );
    await page.goto('/account/notes');
    await notesPage.expectAuthenticated();

    await notesPage.signOut();
    await expect(notesPage.status()).toContainText('Logged out');

    await page.goto('/account/notes');
    await notesPage.expectGuest();
  });

  test('API-authenticated session opens notes without UI login', { tag: '@p1' }, async ({
    notesPage,
    registeredUser,
  }) => {
    await notesPage.openAuthenticated(registeredUser.token);
    await notesPage.expectAuthenticated();
  });
});
