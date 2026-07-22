import { test, expect } from '../../src/fixtures/test.fixtures';
import { expectNoUnexpectedSeriousA11yViolations } from '../../src/helpers/a11y.helper';

test.describe('UI accessibility', () => {
  test('auth screen has no unexpected serious/critical axe violations', { tag: '@p1' }, async ({
    authPage,
    page,
  }) => {
    await authPage.goto();
    await expect(authPage.authSection()).toBeVisible();
    await expectNoUnexpectedSeriousA11yViolations(page, 'auth screen');
  });

  test('notes screen has no unexpected serious/critical axe violations', { tag: '@p1' }, async ({
    notesPage,
    page,
    registeredUser,
  }) => {
    await notesPage.openAuthenticated(registeredUser.token);
    await notesPage.expectAuthenticated();
    await expect(notesPage.notesView()).toBeVisible();
    await expectNoUnexpectedSeriousA11yViolations(page, 'notes screen');
  });
});
