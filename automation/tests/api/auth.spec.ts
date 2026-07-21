import { test, expect } from '@playwright/test';
import { AuthClient } from '../../src/clients/auth.client';
import { MailhogClient } from '../../src/clients/mailhog.client';
import { AuthHelper } from '../../src/helpers/auth.helper';
import { defaultPassword, uniqueEmail } from '../../src/helpers/data.factory';

test.describe('API Auth', () => {
  test('signup sends confirmation email and confirm returns JWT', async ({ request }) => {
    const auth = new AuthClient(request);
    const mailhog = new MailhogClient(request);
    const email = uniqueEmail('signup');
    const password = defaultPassword();

    const signupResponse = await auth.signup({ email, password });
    expect(signupResponse.status()).toBe(201);
    const signupBody = await auth.expectJson(signupResponse);
    expect(signupBody.message).toBe('Confirmation code sent to email.');

    const code = await mailhog.waitForConfirmationCode(email);
    expect(code).toMatch(/^\d{6}$/);

    const confirmResponse = await auth.confirm(email, code);
    expect([200, 201]).toContain(confirmResponse.status());
    const confirmBody = await auth.expectJson(confirmResponse);
    expect(confirmBody.token).toEqual(expect.any(String));
    expect(confirmBody.message).toBe('Account confirmed.');
  });

  test('signin returns JWT for verified user', async ({ request }) => {
    const auth = new AuthClient(request);
    const helper = new AuthHelper(request);
    const user = await helper.registerVerifiedUser();

    const signinResponse = await auth.signin({ email: user.email, password: user.password });
    expect(signinResponse.status()).toBe(200);
    const body = await auth.expectJson(signinResponse);
    expect(body.token).toEqual(expect.any(String));
  });

  test('signin rejects invalid credentials', async ({ request }) => {
    const auth = new AuthClient(request);
    const helper = new AuthHelper(request);
    const user = await helper.registerVerifiedUser();

    const response = await auth.signin({ email: user.email, password: 'WrongPass1!' });
    expect(response.status()).toBe(401);
  });

  test('signin rejects unverified user', async ({ request }) => {
    const auth = new AuthClient(request);
    const helper = new AuthHelper(request);
    const pending = await helper.signupOnly();

    const response = await auth.signin({ email: pending.email, password: pending.password });
    expect(response.status()).toBe(401);
  });

  test('GET /me returns profile with valid token and 401 without token', async ({ request }) => {
    const auth = new AuthClient(request);
    const helper = new AuthHelper(request);
    const user = await helper.registerVerifiedUser();

    const meResponse = await auth.me(user.token);
    expect(meResponse.status()).toBe(200);
    const meBody = await auth.expectJson(meResponse);
    expect(meBody.email).toBe(user.email);
    expect(meBody.id).toEqual(expect.any(String));

    const unauthorized = await auth.me();
    expect(unauthorized.status()).toBe(401);
  });

  test('signup validation rejects invalid email and short password', async ({ request }) => {
    const auth = new AuthClient(request);

    const badEmail = await auth.signup({ email: 'not-an-email', password: defaultPassword() });
    expect(badEmail.status()).toBe(400);
    expect((await badEmail.json()).error).toMatch(/email/i);

    const shortPassword = await auth.signup({ email: uniqueEmail('short'), password: 'short' });
    expect(shortPassword.status()).toBe(400);
    expect((await shortPassword.json()).error).toMatch(/password/i);
  });

  test('signup rejects already verified user', async ({ request }) => {
    const auth = new AuthClient(request);
    const helper = new AuthHelper(request);
    const user = await helper.registerVerifiedUser();

    const response = await auth.signup({ email: user.email, password: user.password });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe('User already exists.');
  });

  test('confirm rejects invalid code', async ({ request }) => {
    const auth = new AuthClient(request);
    const helper = new AuthHelper(request);
    const pending = await helper.signupOnly();

    const response = await auth.confirm(pending.email, '000000');
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toMatch(/invalid or expired/i);
  });
});
