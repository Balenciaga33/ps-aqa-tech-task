import { test, expect, annotateKnownIssue } from '../../src/fixtures/test.fixtures';
import { defaultPassword, uniqueEmail } from '../../src/helpers/data.factory';

test.describe('API Auth', () => {
  test('signup sends confirmation email and confirm returns JWT', async ({
    authClient,
    mailhog,
  }) => {
    annotateKnownIssue(1, 'confirm returns 201 instead of documented 200');
    const email = uniqueEmail('signup');
    const password = defaultPassword();

    const signupResponse = await authClient.signup({ email, password });
    expect(signupResponse.status()).toBe(201);
    const signupBody = await authClient.expectJson(signupResponse);
    expect(signupBody.message).toBe('Confirmation code sent to email.');

    const code = await mailhog.waitForConfirmationCode(email);
    expect(code).toMatch(/^\d{6}$/);

    const confirmResponse = await authClient.confirm(email, code);
    expect(confirmResponse.status()).toBe(201);
    const confirmBody = await authClient.expectJson(confirmResponse);
    expect(confirmBody.token).toEqual(expect.any(String));
    expect(confirmBody.message).toBe('Account confirmed.');

    const me = await authClient.me(confirmBody.token as string);
    expect(me.status()).toBe(200);
    expect((await me.json()).email).toBe(email);
  });

  test('signin returns JWT for verified user', async ({ authClient, registeredUser }) => {
    const signinResponse = await authClient.signin({
      email: registeredUser.email,
      password: registeredUser.password,
    });
    expect(signinResponse.status()).toBe(200);
    const body = await authClient.expectJson(signinResponse);
    expect(body.token).toEqual(expect.any(String));
  });

  test('signin rejects invalid credentials', async ({ authClient, registeredUser }) => {
    const response = await authClient.signin({
      email: registeredUser.email,
      password: 'WrongPass1!',
    });
    expect(response.status()).toBe(401);
  });

  test('signin rejects unverified user', async ({ authClient, authHelper }) => {
    const pending = await authHelper.signupOnly();
    const response = await authClient.signin({
      email: pending.email,
      password: pending.password,
    });
    expect(response.status()).toBe(401);
  });

  test('GET /me returns profile with valid token and 401 without token', async ({
    authClient,
    registeredUser,
  }) => {
    const meResponse = await authClient.me(registeredUser.token);
    expect(meResponse.status()).toBe(200);
    const meBody = await authClient.expectJson(meResponse);
    expect(meBody.email).toBe(registeredUser.email);
    expect(meBody.id).toEqual(expect.any(String));

    const unauthorized = await authClient.me();
    expect(unauthorized.status()).toBe(401);
  });

  test('signup validation rejects invalid email and short password', async ({ authClient }) => {
    const badEmail = await authClient.signup({ email: 'not-an-email', password: defaultPassword() });
    expect(badEmail.status()).toBe(400);
    expect((await badEmail.json()).error).toMatch(/email/i);

    const shortPassword = await authClient.signup({
      email: uniqueEmail('short'),
      password: 'short',
    });
    expect(shortPassword.status()).toBe(400);
    expect((await shortPassword.json()).error).toMatch(/password/i);
  });

  test('signup rejects already verified user', async ({ authClient, registeredUser }) => {
    const response = await authClient.signup({
      email: registeredUser.email,
      password: registeredUser.password,
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe('User already exists.');
  });

  test('confirm rejects invalid code', async ({ authClient, authHelper }) => {
    const pending = await authHelper.signupOnly();
    const response = await authClient.confirm(pending.email, '000000');
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toMatch(/invalid or expired/i);
  });

  test('confirm rejects reused confirmation code', async ({ authClient, mailhog }) => {
    const email = uniqueEmail('reuse');
    const password = defaultPassword();
    expect((await authClient.signup({ email, password })).status()).toBe(201);
    const code = await mailhog.waitForConfirmationCode(email);
    expect((await authClient.confirm(email, code)).status()).toBe(201);

    const reuse = await authClient.confirm(email, code);
    expect(reuse.status()).toBe(400);
    expect((await reuse.json()).error).toMatch(/invalid or expired/i);
  });
});
