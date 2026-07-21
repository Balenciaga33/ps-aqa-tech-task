import { test, expect } from '../../src/fixtures/test.fixtures';
import { defaultPassword, uniqueEmail } from '../../src/helpers/data.factory';
import { TOKEN_KEY } from '../../src/pages/base.page';

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

  const html5SignupBlocks = [
    {
      name: 'password shorter than 8 characters',
      email: () => uniqueEmail('html5-pass'),
      password: 'short',
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
