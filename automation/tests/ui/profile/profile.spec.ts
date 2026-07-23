import { test, expect } from '../../../src/fixtures/test.fixtures';

test.describe('UI Profile', () => {
  test('profile shows email and user id after sign-in', { tag: '@p1' }, async ({
    authPage,
    profilePage,
    registeredUser,
  }) => {
    await authPage.goto();
    const signin = await authPage.signIn(registeredUser.email, registeredUser.password);
    expect(signin.status()).toBe(200);
    await authPage.expectAuthenticated();

    await profilePage.openProfile();
    await expect(profilePage.email()).toHaveText(registeredUser.email);
    await expect(profilePage.userId()).not.toHaveText('-');
  });

  test('profile is available for API-authenticated session', { tag: '@p1' }, async ({
    notesPage,
    profilePage,
    registeredUser,
  }) => {
    await notesPage.openAuthenticated(registeredUser.token);
    await notesPage.expectAuthenticated();
    await profilePage.openProfile();
    await expect(profilePage.email()).toHaveText(registeredUser.email);
    await expect(profilePage.userId()).not.toHaveText('-');
  });
});
