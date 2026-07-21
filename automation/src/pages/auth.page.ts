import { BasePage } from './base.page';

export class AuthPage extends BasePage {
  async signUp(email: string, password: string) {
    await this.page.locator('#signup-email').fill(email);
    await this.page.locator('#signup-password').fill(password);
    await this.page.locator('#signup-form button[type="submit"]').click();
  }

  async signIn(email: string, password: string) {
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth/signin') && response.request().method() === 'POST',
    );
    await this.page.locator('#signin-email').fill(email);
    await this.page.locator('#signin-password').fill(password);
    await this.page.locator('#signin-form button[type="submit"]').click();
    return responsePromise;
  }

  authSection() {
    return this.page.locator('#auth-section');
  }
}
