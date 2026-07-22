import { test, expect } from '../../../src/fixtures/test.fixtures';
import { defaultPassword, uniqueEmail } from '../../../src/helpers/data.factory';

test.describe('UI Auth / signup', () => {
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

  const html5SignupBlocks = [
    {
      name: 'password shorter than 8 characters',
      email: () => uniqueEmail('html5-pass'),
      password: 'short',
      invalidField: 'password' as const,
    },
    {
      name: 'password of 7 characters',
      email: () => uniqueEmail('html5-7'),
      password: '1234567',
      invalidField: 'password' as const,
    },
    {
      name: 'malformed email',
      email: () => 'not-an-email',
      password: defaultPassword(),
      invalidField: 'email' as const,
    },
  ];

  for (const { name, email, password, invalidField } of html5SignupBlocks) {
    test(`signup is blocked client-side for ${name}`, { tag: '@p1' }, async ({
      authPage,
      page,
    }) => {
      await authPage.goto();
      await authPage.fillSignUp(email(), password);

      const requestPromise = page
        .waitForRequest((req) => req.url().includes('/api/auth/signup'), { timeout: 1000 })
        .then(() => true)
        .catch(() => false);

      await authPage.submitSignUp();

      const field =
        invalidField === 'password' ? authPage.signupPassword() : authPage.signupEmail();
      const valid = await field.evaluate((el) => (el as HTMLInputElement).validity.valid);
      expect(valid).toBe(false);
      expect(await requestPromise).toBe(false);
      await authPage.expectGuest();
    });
  }

  test('invalid confirmation link shows error and stays on auth', { tag: '@p1' }, async ({
    authPage,
    page,
  }) => {
    await page.goto(
      `/?confirm_email=${encodeURIComponent(uniqueEmail('bad-link'))}&confirm_code=000000`,
    );
    await authPage.expectGuest();
    await expect(authPage.status()).not.toHaveText('');
  });
});
