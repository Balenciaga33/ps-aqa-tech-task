import { test, expect } from '../../../src/fixtures/test.fixtures';
import { meResponseSchema, parseSchema } from '../../../src/schemas/api.schemas';

test.describe('API Auth / me', () => {
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
    { name: 'with an empty token', token: '' },
  ] as const;

  for (const { name, token } of unauthorizedMeCases) {
    test(`GET /me rejects request ${name}`, { tag: '@p0' }, async ({ authClient }) => {
      const response = await authClient.me(token);
      expect(response.status()).toBe(401);
    });
  }
});
