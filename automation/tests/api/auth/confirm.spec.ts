import { test, expect } from '../../../src/fixtures/test.fixtures';
import { defaultPassword, uniqueEmail } from '../../../src/helpers/data.factory';

test.describe('API Auth / confirm', () => {
  test('confirm rejects invalid code', { tag: '@p0' }, async ({ authClient, authHelper }) => {
    const pending = await authHelper.signupOnly();
    const response = await authClient.confirm(pending.email, '000000');
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toMatch(/invalid or expired/i);
  });

  test('confirm rejects malformed code', { tag: '@p1' }, async ({ authClient, authHelper }) => {
    const pending = await authHelper.signupOnly();
    const response = await authClient.confirm(pending.email, '12ab');
    expect(response.status()).toBe(400);
  });

  test('confirm rejects unknown email', { tag: '@p1' }, async ({ authClient }) => {
    const response = await authClient.confirm(uniqueEmail('ghost'), '123456');
    expect(response.status()).toBe(400);
    expect((await response.json()).error).toBe('User not found.');
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
