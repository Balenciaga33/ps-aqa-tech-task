import { Page, expect } from '@playwright/test';

const TOKEN_KEY = 'qa_task_token';

export class AppPage {
  constructor(private readonly page: Page) {}

  async goto(path = '/') {
    await this.page.goto(path);
  }

  status() {
    return this.page.locator('#status');
  }

  async signUp(email: string, password: string) {
    await this.page.locator('#signup-email').fill(email);
    await this.page.locator('#signup-password').fill(password);
    await this.page.locator('#signup-form button[type="submit"]').click();
  }

  async signIn(email: string, password: string) {
    const responsePromise = this.page.waitForResponse((response) =>
      response.url().includes('/api/auth/signin') && response.request().method() === 'POST',
    );
    await this.page.locator('#signin-email').fill(email);
    await this.page.locator('#signin-password').fill(password);
    await this.page.locator('#signin-form button[type="submit"]').click();
    return responsePromise;
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

  async openProfile() {
    await this.page.locator('#nav-profile-button').click();
    await expect(this.page.locator('#profile-view')).toBeVisible();
  }

  async openNotes() {
    await this.page.locator('#nav-notes-button').click();
    await expect(this.page.locator('#notes-view')).toBeVisible();
  }

  async createNote(title: string, content: string) {
    const responsePromise = this.page.waitForResponse((response) =>
      response.url().includes('/api/notes') && response.request().method() === 'POST',
    );
    await this.page.locator('#note-title').fill(title);
    await this.page.locator('#note-content').fill(content);
    await this.page.locator('#create-note-form button[type="submit"]').click();
    return responsePromise;
  }

  noteItem(title: string) {
    return this.page.locator('.note-item', { hasText: title });
  }

  async editNote(currentTitle: string, nextTitle: string, nextContent: string) {
    const item = this.noteItem(currentTitle);
    await item.locator('[data-action="edit"]').click();
    const dialog = this.page.locator('.modal-dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('input[name="title"]').fill(nextTitle);
    await dialog.locator('textarea[name="content"]').fill(nextContent);
    const responsePromise = this.page.waitForResponse((response) =>
      response.url().includes('/api/notes/') && response.request().method() === 'PUT',
    );
    await dialog.locator('button[type="submit"]').click();
    return responsePromise;
  }

  async deleteNote(title: string) {
    const item = this.noteItem(title);
    await item.locator('[data-action="delete"]').click();
    const dialog = this.page.locator('.modal-dialog');
    await expect(dialog).toBeVisible();
    const responsePromise = this.page.waitForResponse((response) =>
      response.url().includes('/api/notes/') && response.request().method() === 'DELETE',
    );
    await dialog.locator('[data-action="delete"]').click();
    return responsePromise;
  }

  async cancelDeleteNote(title: string) {
    const item = this.noteItem(title);
    await item.locator('[data-action="delete"]').click();
    const dialog = this.page.locator('.modal-dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('[data-action="cancel"]').click();
    await expect(dialog).toHaveCount(0);
  }

  async searchNotes(query: string) {
    const responsePromise = this.page.waitForResponse((response) =>
      response.url().includes('/api/notes') && response.request().method() === 'GET',
    );
    await this.page.locator('#notes-search-query').fill(query);
    return responsePromise;
  }

  async setPageSize(size: string) {
    const responsePromise = this.page.waitForResponse((response) =>
      response.url().includes('/api/notes') && response.request().method() === 'GET',
    );
    await this.page.locator('#notes-page-size').selectOption(size);
    return responsePromise;
  }

  async setSort(value: string) {
    const responsePromise = this.page.waitForResponse((response) =>
      response.url().includes('/api/notes') && response.request().method() === 'GET',
    );
    await this.page.locator('#notes-search-sort').selectOption(value);
    return responsePromise;
  }

  async nextPage() {
    const responsePromise = this.page.waitForResponse((response) =>
      response.url().includes('/api/notes') && response.request().method() === 'GET',
    );
    await this.page.locator('#notes-next-page').click();
    return responsePromise;
  }

  listTotal() {
    return this.page.locator('#notes-list-total');
  }

  pageInfo() {
    return this.page.locator('#notes-page-info');
  }

  nextPageButton() {
    return this.page.locator('#notes-next-page');
  }
}
