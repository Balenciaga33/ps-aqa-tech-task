import { test, expect } from '../../src/fixtures/test.fixtures';
import { notePayload } from '../../src/helpers/data.factory';

test.describe('UI Notes', () => {
  test('create, edit and delete note from UI', { tag: '@p0' }, async ({ app, registeredUser }) => {
    await app.openAuthenticated(registeredUser.token);
    await app.expectAuthenticated();

    const created = notePayload({ title: `ui-create-${Date.now()}` });
    const updated = notePayload({ title: `ui-updated-${Date.now()}` });

    const createResponse = await app.createNote(created.title, created.content);
    expect(createResponse.status()).toBe(201);
    await expect(app.status()).toContainText('Note created');
    await expect(app.noteItem(created.title)).toBeVisible();

    const updateResponse = await app.editNote(created.title, updated.title, updated.content);
    expect(updateResponse.status()).toBe(200);
    await expect(app.status()).toContainText('Note updated');
    await expect(app.noteItem(updated.title)).toContainText(updated.content);

    const deleteResponse = await app.deleteNote(updated.title);
    expect([200, 204]).toContain(deleteResponse.status());
    await expect(app.status()).toContainText('Note deleted');
    await expect(app.noteItem(updated.title)).toHaveCount(0);
  });

  test('cancel delete keeps the note', { tag: '@p1' }, async ({
    app,
    notesClient,
    registeredUser,
  }) => {
    const payload = notePayload({ title: `keep-${Date.now()}` });
    expect((await notesClient.create(registeredUser.token, payload)).status()).toBe(201);

    await app.openAuthenticated(registeredUser.token);
    await app.expectAuthenticated();
    await expect(app.noteItem(payload.title)).toBeVisible();

    await app.cancelDeleteNote(payload.title);
    await expect(app.noteItem(payload.title)).toBeVisible();
  });

  test('search filters notes in the list', { tag: '@p1' }, async ({
    app,
    page,
    notesClient,
    registeredUser,
  }) => {
    const marker = `find-me-${Date.now()}`;
    expect(
      (await notesClient.create(registeredUser.token, notePayload({ title: marker, content: 'visible' }))).status(),
    ).toBe(201);
    expect(
      (
        await notesClient.create(
          registeredUser.token,
          notePayload({ title: `other-${Date.now()}`, content: 'hidden' }),
        )
      ).status(),
    ).toBe(201);

    await app.openAuthenticated(registeredUser.token);
    await app.expectAuthenticated();
    await app.searchNotes(marker);
    await expect(app.noteItem(marker)).toBeVisible();
    await expect(page.locator('.note-item')).toHaveCount(1);
  });

  test('sort by title A-Z updates the list order', { tag: '@p1' }, async ({
    app,
    page,
    notesClient,
    registeredUser,
  }) => {
    const prefix = `ui-sort-${Date.now()}`;
    for (const title of [`${prefix}-c`, `${prefix}-a`, `${prefix}-b`]) {
      expect(
        (await notesClient.create(registeredUser.token, notePayload({ title, content: 'x' }))).status(),
      ).toBe(201);
    }

    await app.openAuthenticated(registeredUser.token);
    await app.expectAuthenticated();
    await app.searchNotes(prefix);
    await app.setSort('title_asc');

    const titles = await page.locator('.note-item h3').allTextContents();
    expect(titles).toEqual([`${prefix}-a`, `${prefix}-b`, `${prefix}-c`]);
  });
});
