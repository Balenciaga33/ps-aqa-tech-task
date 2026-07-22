import { test, expect } from '../../../src/fixtures/test.fixtures';

test.describe('UI Auth / signin', () => {
  test('sign in shows notes for verified user', { tag: '@p0' }, async ({
    authPage,
    notesPage,
    registeredUser,
  }) => {
    await authPage.goto();
    const signin = await authPage.signIn(registeredUser.email, registeredUser.password);
    expect(signin.status()).toBe(200);
    await authPage.expectAuthenticated();
    await expect(authPage.status()).toContainText('Signed in');
    await expect(notesPage.notesView()).toBeVisible();
  });

  test('sign in with wrong password shows error', { tag: '@p1' }, async ({
    authPage,
    registeredUser,
  }) => {
    await authPage.goto();
    await authPage.signIn(registeredUser.email, 'WrongPass1!');
    await expect(authPage.authSection()).toBeVisible();
    await expect(authPage.status()).not.toHaveText('');
  });

  test('sign in of unverified user shows error and stays on auth', { tag: '@p1' }, async ({
    authPage,
    authHelper,
  }) => {
    const pending = await authHelper.signupOnly();
    await authPage.goto();
    await authPage.signIn(pending.email, pending.password);
    await authPage.expectGuest();
    await expect(authPage.status()).not.toHaveText('');
  });
});
