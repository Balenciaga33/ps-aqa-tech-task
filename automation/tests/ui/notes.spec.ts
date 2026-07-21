import { test, expect } from '@playwright/test';
import { NotesClient } from '../../src/clients/notes.client';
import { AuthHelper } from '../../src/helpers/auth.helper';
import { notePayload } from '../../src/helpers/data.factory';
import { AppPage } from '../../src/pages/app.page';

test.describe('UI Notes', () => {
  test('create, edit and delete note from UI', async ({ page, request }) => {
    const helper = new AuthHelper(request);
    const user = await helper.registerVerifiedUser();
    const app = new AppPage(page);
    const created = notePayload({ title: `ui-create-${Date.now()}` });
    const updated = notePayload({ title: `ui-updated-${Date.now()}` });

    await app.goto();
    await app.signIn(user.email, user.password);
    await app.expectAuthenticated();

    await app.createNote(created.title, created.content);
    await expect(app.status()).toContainText('Note created');
    await expect(app.noteItem(created.title)).toBeVisible();
    await expect(app.noteItem(created.title)).toContainText(created.content);

    await app.editNote(created.title, updated.title, updated.content);
    await expect(app.status()).toContainText('Note updated');
    await expect(app.noteItem(updated.title)).toBeVisible();
    await expect(app.noteItem(updated.title)).toContainText(updated.content);

    await app.deleteNote(updated.title);
    await expect(app.status()).toContainText('Note deleted');
    await expect(app.noteItem(updated.title)).toHaveCount(0);
  });

  test('search filters notes in the list', async ({ page, request }) => {
    const helper = new AuthHelper(request);
    const notes = new NotesClient(request);
    const user = await helper.registerVerifiedUser();
    const marker = `find-me-${Date.now()}`;

    const match = await notes.create(user.token, notePayload({ title: marker, content: 'visible' }));
    expect(match.status()).toBe(201);
    const other = await notes.create(user.token, notePayload({ title: `other-${Date.now()}`, content: 'hidden' }));
    expect(other.status()).toBe(201);

    const app = new AppPage(page);
    await app.goto();
    await app.signIn(user.email, user.password);
    await app.expectAuthenticated();

    await app.searchNotes(marker);
    await expect(app.noteItem(marker)).toBeVisible();
    await expect(page.locator('.note-item')).toHaveCount(1);
  });
});
