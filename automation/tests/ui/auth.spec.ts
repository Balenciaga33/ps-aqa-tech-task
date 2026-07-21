import { test, expect } from '../../src/fixtures/test.fixtures';
import { defaultPassword, uniqueEmail } from '../../src/helpers/data.factory';

test.describe('UI Auth', () => {
  test('sign up via UI, confirm via MailHog link, land in account', { tag: '@p0' }, async ({
    app,
    page,
    mailhog,
  }) => {
    const email = uniqueEmail('ui-signup');
    const password = defaultPassword();

    await app.goto();
    await app.signUp(email, password);
    await expect(app.status()).toContainText('Sign up request sent');

    const confirmLink = await mailhog.waitForConfirmationLink(email);
    await page.goto(confirmLink);
    await app.expectAuthenticated();
    await expect(app.status()).toContainText('Account confirmed');
  });

  test('sign in shows notes and profile for verified user', { tag: '@p0' }, async ({
    app,
    page,
    registeredUser,
  }) => {
    await app.goto();
    const signin = await app.signIn(registeredUser.email, registeredUser.password);
    expect(signin.status()).toBe(200);
    await app.expectAuthenticated();
    await expect(app.status()).toContainText('Signed in');
    await expect(page.locator('#notes-view')).toBeVisible();

    await app.openProfile();
    await expect(page.locator('#profile-email')).toHaveText(registeredUser.email);
    await expect(page.locator('#profile-id')).not.toHaveText('-');
  });

  test('sign in with wrong password shows error', { tag: '@p1' }, async ({
    app,
    page,
    registeredUser,
  }) => {
    await app.goto();
    await app.signIn(registeredUser.email, 'WrongPass1!');
    await expect(page.locator('#auth-section')).toBeVisible();
    await expect(app.status()).not.toHaveText('');
  });

  test('API-authenticated session opens notes without UI login', { tag: '@p1' }, async ({
    app,
    registeredUser,
  }) => {
    await app.openAuthenticated(registeredUser.token);
    await app.expectAuthenticated();
  });
});
