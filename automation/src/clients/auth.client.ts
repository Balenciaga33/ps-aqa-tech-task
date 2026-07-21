import { APIRequestContext, APIResponse, expect } from '@playwright/test';

export type AuthCredentials = {
  email: string;
  password: string;
};

export class AuthClient {
  constructor(private readonly request: APIRequestContext) {}

  async signup(credentials: AuthCredentials): Promise<APIResponse> {
    return this.request.post('/api/auth/signup', {
      data: credentials,
    });
  }

  async confirm(email: string, code: string): Promise<APIResponse> {
    return this.request.post('/api/auth/confirm', {
      data: { email, code },
    });
  }

  async signin(credentials: AuthCredentials): Promise<APIResponse> {
    return this.request.post('/api/auth/signin', {
      data: credentials,
    });
  }

  async me(token?: string): Promise<APIResponse> {
    return this.request.get('/api/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }

  async expectJson(response: APIResponse): Promise<Record<string, unknown>> {
    const body = await response.json();
    expect(body).toBeTruthy();
    return body as Record<string, unknown>;
  }
}
