import { test, expect } from '../../src/fixtures/test.fixtures';
import { defaultPassword, uniqueEmail } from '../../src/helpers/data.factory';

test.describe('UI Auth', () => {
  test('sign up via UI, confirm via MailHog link, land in account', { tag: '@p0' }, async ({
    authPage,
    page,
    mailhog,
  }) => {
    const email = uniqueEmail('ui-signup');
    const password = defaultPassword();

    await authPage.goto();
    await authPage.signUp(email, password);
    await expect(authPage.status()).toContainText('Sign up request sent');

    const confirmLink = await mailhog.waitForConfirmationLink(email);
    await page.goto(confirmLink);
    await authPage.expectAuthenticated();
    await expect(authPage.status()).toContainText('Account confirmed');
  });

  test('sign in shows notes and profile for verified user', { tag: '@p0' }, async ({
    authPage,
    notesPage,
    profilePage,
    page,
    registeredUser,
  }) => {
    await authPage.goto();
    const signin = await authPage.signIn(registeredUser.email, registeredUser.password);
    expect(signin.status()).toBe(200);
    await authPage.expectAuthenticated();
    await expect(authPage.status()).toContainText('Signed in');
    await expect(notesPage.notesView()).toBeVisible();

    await profilePage.openProfile();
    await expect(profilePage.email()).toHaveText(registeredUser.email);
    await expect(profilePage.userId()).not.toHaveText('-');
    expect(page).toBeTruthy();
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

  test('API-authenticated session opens notes without UI login', { tag: '@p1' }, async ({
    notesPage,
    registeredUser,
  }) => {
    await notesPage.openAuthenticated(registeredUser.token);
    await notesPage.expectAuthenticated();
  });
});
