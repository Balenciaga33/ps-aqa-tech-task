import { Page, expect } from '@playwright/test';

export const TOKEN_KEY = 'qa_task_token';

export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path = '/') {
    await this.page.goto(path);
  }

  status() {
    return this.page.locator('#status');
  }

  /**
   * Skip UI login — inject JWT the same way the SPA stores it after auth.
   */
  async openAuthenticated(token: string, path = '/account/notes') {
    await this.page.addInitScript(
      ([key, value]) => {
        localStorage.setItem(key, value);
      },
      [TOKEN_KEY, token] as [string, string],
    );
    await this.page.goto(path);
  }

  async expectAuthenticated() {
    await expect(this.page.locator('#account-section')).toBeVisible();
    await expect(this.page.locator('#auth-section')).toBeHidden();
  }

  async openNotes() {
    await this.page.locator('#nav-notes-button').click();
    await expect(this.page.locator('#notes-view')).toBeVisible();
  }

  async openProfile() {
    await this.page.locator('#nav-profile-button').click();
    await expect(this.page.locator('#profile-view')).toBeVisible();
  }
}
