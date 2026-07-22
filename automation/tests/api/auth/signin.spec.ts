import { test, expect } from '../../../src/fixtures/test.fixtures';
import { tokenResponseSchema, parseSchema } from '../../../src/schemas/api.schemas';

test.describe('API Auth / signin', () => {
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
});
