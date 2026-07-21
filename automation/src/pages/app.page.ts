import { Page, expect } from '@playwright/test';

export class AppPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('/');
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
    await this.page.locator('#signin-email').fill(email);
    await this.page.locator('#signin-password').fill(password);
    await this.page.locator('#signin-form button[type="submit"]').click();
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
    await this.page.locator('#note-title').fill(title);
    await this.page.locator('#note-content').fill(content);
    await this.page.locator('#create-note-form button[type="submit"]').click();
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
    await dialog.locator('button[type="submit"]').click();
  }

  async deleteNote(title: string) {
    const item = this.noteItem(title);
    await item.locator('[data-action="delete"]').click();
    const dialog = this.page.locator('.modal-dialog');
    await expect(dialog).toBeVisible();
    await dialog.locator('[data-action="delete"]').click();
  }

  async searchNotes(query: string) {
    await this.page.locator('#notes-search-query').fill(query);
  }
}
