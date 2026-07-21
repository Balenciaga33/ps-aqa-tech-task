import { Page, expect } from '@playwright/test';

export class UpdateNoteModal {
  constructor(private readonly page: Page) {}

  dialog() {
    return this.page.locator('.modal-dialog');
  }

  async save(title: string, content: string) {
    const dialog = this.dialog();
    await expect(dialog).toBeVisible();
    await dialog.locator('input[name="title"]').fill(title);
    await dialog.locator('textarea[name="content"]').fill(content);
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/notes/') && response.request().method() === 'PUT',
    );
    await dialog.locator('button[type="submit"]').click();
    return responsePromise;
  }
}

export class DeleteNoteModal {
  constructor(private readonly page: Page) {}

  dialog() {
    return this.page.locator('.modal-dialog');
  }

  async confirm() {
    const dialog = this.dialog();
    await expect(dialog).toBeVisible();
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes('/api/notes/') && response.request().method() === 'DELETE',
    );
    await dialog.locator('[data-action="delete"]').click();
    return responsePromise;
  }

  async cancel() {
    const dialog = this.dialog();
    await expect(dialog).toBeVisible();
    await dialog.locator('[data-action="cancel"]').click();
    await expect(dialog).toHaveCount(0);
  }
}
