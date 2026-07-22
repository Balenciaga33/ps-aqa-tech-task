import { test, expect, annotateKnownIssue } from '../../../src/fixtures/test.fixtures';
import { defaultPassword, uniqueEmail } from '../../../src/helpers/data.factory';
import {
  meResponseSchema,
  parseSchema,
  signupResponseSchema,
  tokenResponseSchema,
} from '../../../src/schemas/api.schemas';

test.describe('API Auth / signup', () => {
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

  const signupValidationCases = [
    {
      name: 'empty email',
      payload: () => ({ email: '', password: defaultPassword() }),
      error: /email is required/i,
    },
    {
      name: 'invalid email format',
      payload: () => ({ email: 'not-an-email', password: defaultPassword() }),
      error: /invalid email format/i,
    },
    {
      name: 'email without domain',
      payload: () => ({ email: 'a@b', password: defaultPassword() }),
      error: /invalid email format/i,
    },
    {
      name: 'empty password',
      payload: () => ({ email: uniqueEmail('empty-pass'), password: '' }),
      error: /password is required/i,
    },
    {
      name: 'password shorter than 8 characters',
      payload: () => ({ email: uniqueEmail('short'), password: 'short' }),
      error: /password must be at least 8/i,
    },
    {
      name: 'password of 7 characters',
      payload: () => ({ email: uniqueEmail('seven'), password: '1234567' }),
      error: /password must be at least 8/i,
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
});
