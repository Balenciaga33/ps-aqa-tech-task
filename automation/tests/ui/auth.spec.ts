import { test, expect } from '@playwright/test';
import { MailhogClient } from '../../src/clients/mailhog.client';
import { AuthHelper } from '../../src/helpers/auth.helper';
import { defaultPassword, uniqueEmail } from '../../src/helpers/data.factory';
import { AppPage } from '../../src/pages/app.page';

test.describe('UI Auth', () => {
  test('sign up via UI, confirm via MailHog link, land in account', async ({ page, request }) => {
    const app = new AppPage(page);
    const mailhog = new MailhogClient(request);
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

  test('sign in shows notes and profile for verified user', async ({ page, request }) => {
    const helper = new AuthHelper(request);
    const user = await helper.registerVerifiedUser();
    const app = new AppPage(page);

    await app.goto();
    await app.signIn(user.email, user.password);
    await app.expectAuthenticated();
    await expect(app.status()).toContainText('Signed in');
    await expect(page.locator('#notes-view')).toBeVisible();

    await app.openProfile();
    await expect(page.locator('#profile-email')).toHaveText(user.email);
    await expect(page.locator('#profile-id')).not.toHaveText('-');
  });

  test('sign in with wrong password shows error', async ({ page, request }) => {
    const helper = new AuthHelper(request);
    const user = await helper.registerVerifiedUser();
    const app = new AppPage(page);

    await app.goto();
    await app.signIn(user.email, 'WrongPass1!');
    await expect(page.locator('#auth-section')).toBeVisible();
    await expect(app.status()).toBeVisible();
    await expect(app.status()).not.toHaveText('');
  });
});
