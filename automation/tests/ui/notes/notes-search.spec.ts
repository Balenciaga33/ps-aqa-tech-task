import { test, expect } from '../../../src/fixtures/test.fixtures';
import { notePayload } from '../../../src/helpers/data.factory';

test.describe('UI Notes / search', () => {
  test('search filters notes in the list', { tag: '@p1' }, async ({
    notesPage,
    page,
    notesClient,
    registeredUser,
  }) => {
    const marker = `find-me-${Date.now()}`;
    expect(
      (
        await notesClient.create(
          registeredUser.token,
          notePayload({ title: marker, content: 'visible' }),
        )
      ).status(),
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
});
