import { APIRequestContext, expect } from '@playwright/test';
import { AuthClient } from '../clients/auth.client';
import { MailhogClient } from '../clients/mailhog.client';
import { defaultPassword, uniqueEmail } from './data.factory';

export type RegisteredUser = {
  email: string;
  password: string;
  token: string;
};

export class AuthHelper {
  private readonly auth: AuthClient;
  private readonly mailhog: MailhogClient;

  constructor(request: APIRequestContext) {
    this.auth = new AuthClient(request);
    this.mailhog = new MailhogClient(request);
  }

  async registerVerifiedUser(password = defaultPassword()): Promise<RegisteredUser> {
    const email = uniqueEmail('verified');
    const signupResponse = await this.auth.signup({ email, password });
    expect(signupResponse.status()).toBe(201);

    const code = await this.mailhog.waitForConfirmationCode(email);
    const confirmResponse = await this.auth.confirm(email, code);
    expect([200, 201]).toContain(confirmResponse.status());

    const body = await confirmResponse.json();
    expect(body.token).toBeTruthy();

    return {
      email,
      password,
      token: body.token as string,
    };
  }

  async signupOnly(password = defaultPassword()): Promise<{ email: string; password: string }> {
    const email = uniqueEmail('pending');
    const signupResponse = await this.auth.signup({ email, password });
    expect(signupResponse.status()).toBe(201);

    return { email, password };
  }
}
