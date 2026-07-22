import { test, expect, annotateKnownIssue } from '../../src/fixtures/test.fixtures';
import { defaultPassword, uniqueEmail } from '../../src/helpers/data.factory';
import {
  meResponseSchema,
  parseSchema,
  signupResponseSchema,
  tokenResponseSchema,
} from '../../src/schemas/api.schemas';

test.describe('API Auth', () => {
  test('signup sends confirmation email and confirm returns JWT', { tag: '@p0' }, async ({
    authClient,
    mailhog,
  }) => {
    annotateKnownIssue('C1', 'confirm returns 201 instead of documented 200');
    const email = uniqueEmail('signup');
    const password = defaultPassword();

    const signupResponse = await authClient.signup({ email, password });
    expect(signupResponse.status()).toBe(201);
    const signupBody = parseSchema(
      signupResponseSchema,
      await authClient.expectJson(signupResponse),
      'signup',
    );
    expect(signupBody.message).toBe('Confirmation code sent to email.');

    const code = await mailhog.waitForConfirmationCode(email);
    expect(code).toMatch(/^\d{6}$/);

    const confirmResponse = await authClient.confirm(email, code);
    expect(confirmResponse.status()).toBe(201);
    const confirmBody = parseSchema(
      tokenResponseSchema,
      await authClient.expectJson(confirmResponse),
      'confirm',
    );
    expect(confirmBody.message).toBe('Account confirmed.');

    const me = await authClient.me(confirmBody.token);
    expect(me.status()).toBe(200);
    const meBody = parseSchema(meResponseSchema, await me.json(), 'me after confirm');
    expect(meBody.email).toBe(email);
  });

  test('signin returns JWT for verified user', { tag: '@p0' }, async ({
    authClient,
    registeredUser,
  }) => {
    const signinResponse = await authClient.signin({
      email: registeredUser.email,
      password: registeredUser.password,
    });
    expect(signinResponse.status()).toBe(200);
    parseSchema(tokenResponseSchema, await authClient.expectJson(signinResponse), 'signin');
  });

  test('signin rejects invalid credentials', { tag: '@p0' }, async ({
    authClient,
    registeredUser,
  }) => {
    const response = await authClient.signin({
      email: registeredUser.email,
      password: 'WrongPass1!',
    });
    expect(response.status()).toBe(401);
  });

  test('signin rejects unverified user', { tag: '@p0' }, async ({ authClient, authHelper }) => {
    const pending = await authHelper.signupOnly();
    const response = await authClient.signin({
      email: pending.email,
      password: pending.password,
    });
    expect(response.status()).toBe(401);
  });

  test('GET /me returns profile with valid token', { tag: '@p0' }, async ({
    authClient,
    registeredUser,
  }) => {
    const meResponse = await authClient.me(registeredUser.token);
    expect(meResponse.status()).toBe(200);
    const meBody = parseSchema(meResponseSchema, await meResponse.json(), 'me');
    expect(meBody.email).toBe(registeredUser.email);
  });

  const unauthorizedMeCases = [
    { name: 'without a token', token: undefined },
    { name: 'with a malformed token', token: 'garbage-token' },
  ] as const;

  for (const { name, token } of unauthorizedMeCases) {
    test(`GET /me rejects request ${name}`, { tag: '@p0' }, async ({ authClient }) => {
      const response = await authClient.me(token);
      expect(response.status()).toBe(401);
    });
  }

  const signupValidationCases = [
    {
      name: 'invalid email format',
      payload: () => ({ email: 'not-an-email', password: defaultPassword() }),
      error: /email/i,
    },
    {
      name: 'password shorter than 8 characters',
      payload: () => ({ email: uniqueEmail('short'), password: 'short' }),
      error: /password/i,
    },
  ] as const;

  for (const { name, payload, error } of signupValidationCases) {
    test(`signup validation rejects ${name}`, { tag: '@p1' }, async ({ authClient }) => {
      const response = await authClient.signup(payload() as { email: string; password: string });
      expect(response.status()).toBe(400);
      expect((await response.json()).error).toMatch(error);
    });
  }

  test('signup rejects already verified user', { tag: '@p0' }, async ({
    authClient,
    registeredUser,
  }) => {
    const response = await authClient.signup({
      email: registeredUser.email,
      password: registeredUser.password,
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe('User already exists.');
  });

  test('confirm rejects invalid code', { tag: '@p0' }, async ({ authClient, authHelper }) => {
    const pending = await authHelper.signupOnly();
    const response = await authClient.confirm(pending.email, '000000');
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toMatch(/invalid or expired/i);
  });

  test('confirm rejects malformed code and unknown email', { tag: '@p1' }, async ({
    authClient,
    authHelper,
  }) => {
    const pending = await authHelper.signupOnly();

    const malformed = await authClient.confirm(pending.email, '12ab');
    expect(malformed.status()).toBe(400);

    const unknown = await authClient.confirm(uniqueEmail('ghost'), '123456');
    expect(unknown.status()).toBe(400);
    expect((await unknown.json()).error).toBe('User not found.');
  });

  test('confirm rejects reused confirmation code', { tag: '@p1' }, async ({
    authClient,
    mailhog,
  }) => {
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
