import { test, expect } from '../../src/fixtures/test.fixtures';
import { notePayload } from '../../src/helpers/data.factory';

test.describe('UI Notes', () => {
  test('create, edit and delete note from UI', { tag: '@p0' }, async ({
    notesPage,
    registeredUser,
  }) => {
    await notesPage.openAuthenticated(registeredUser.token);
    await notesPage.expectAuthenticated();

    const created = notePayload({ title: `ui-create-${Date.now()}` });
    const updated = notePayload({ title: `ui-updated-${Date.now()}` });

    const createResponse = await notesPage.createNote(created.title, created.content);
    expect(createResponse.status()).toBe(201);
    await expect(notesPage.status()).toContainText('Note created');
    await expect(notesPage.noteItem(created.title)).toBeVisible();

    const updateResponse = await notesPage.editNote(created.title, updated.title, updated.content);
    expect(updateResponse.status()).toBe(200);
    await expect(notesPage.status()).toContainText('Note updated');
    await expect(notesPage.noteItem(updated.title)).toContainText(updated.content);

    const deleteResponse = await notesPage.deleteNote(updated.title);
    expect([200, 204]).toContain(deleteResponse.status());
    await expect(notesPage.status()).toContainText('Note deleted');
    await expect(notesPage.noteItem(updated.title)).toHaveCount(0);
  });

  test('cancel delete keeps the note', { tag: '@p1' }, async ({
    notesPage,
    notesClient,
    registeredUser,
  }) => {
    const payload = notePayload({ title: `keep-${Date.now()}` });
    expect((await notesClient.create(registeredUser.token, payload)).status()).toBe(201);

    await notesPage.openAuthenticated(registeredUser.token);
    await notesPage.expectAuthenticated();
    await expect(notesPage.noteItem(payload.title)).toBeVisible();

    await notesPage.cancelDeleteNote(payload.title);
    await expect(notesPage.noteItem(payload.title)).toBeVisible();
  });

  test('cancel edit keeps the note unchanged', { tag: '@p1' }, async ({
    notesPage,
    notesClient,
    registeredUser,
  }) => {
    const payload = notePayload({ title: `edit-keep-${Date.now()}`, content: 'original' });
    expect((await notesClient.create(registeredUser.token, payload)).status()).toBe(201);

    await notesPage.openAuthenticated(registeredUser.token);
    await notesPage.expectAuthenticated();
    await notesPage.cancelEditNote(payload.title);
    await expect(notesPage.noteItem(payload.title)).toContainText('original');
  });

  test('search filters notes in the list', { tag: '@p1' }, async ({
    notesPage,
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

    await notesPage.openAuthenticated(registeredUser.token);
    await notesPage.expectAuthenticated();
    await notesPage.searchNotes(marker);
    await expect(notesPage.noteItem(marker)).toBeVisible();
    await expect(page.locator('.note-item')).toHaveCount(1);
  });

  test('search empty state and clearing query restores the list', { tag: '@p1' }, async ({
    notesPage,
    page,
    notesClient,
    registeredUser,
  }) => {
    const marker = `restore-${Date.now()}`;
    expect(
      (await notesClient.create(registeredUser.token, notePayload({ title: `${marker}-a` }))).status(),
    ).toBe(201);
    expect(
      (await notesClient.create(registeredUser.token, notePayload({ title: `${marker}-b` }))).status(),
    ).toBe(201);

    await notesPage.openAuthenticated(registeredUser.token);
    await notesPage.searchNotes(marker);
    await expect(page.locator('.note-item')).toHaveCount(2);

    await notesPage.searchNotes(`no-match-${Date.now()}`);
    await expect(notesPage.emptyListMessage()).toBeVisible();
    await expect(page.locator('.note-item')).toHaveCount(0);

    await notesPage.searchNotes(marker);
    await expect(page.locator('.note-item')).toHaveCount(2);
  });

  test('sort by title A-Z updates the list order', { tag: '@p1' }, async ({
    notesPage,
    notesClient,
    registeredUser,
  }) => {
    const prefix = `ui-sort-${Date.now()}`;
    for (const title of [`${prefix}-c`, `${prefix}-a`, `${prefix}-b`]) {
      expect(
        (await notesClient.create(registeredUser.token, notePayload({ title, content: 'x' }))).status(),
      ).toBe(201);
    }

    await notesPage.openAuthenticated(registeredUser.token);
    await notesPage.expectAuthenticated();
    await notesPage.searchNotes(prefix);
    await notesPage.setSort('title_asc');

    const titles = await notesPage.noteTitles().allTextContents();
    expect(titles).toEqual([`${prefix}-a`, `${prefix}-b`, `${prefix}-c`]);
  });
});
