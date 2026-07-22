import { test, expect } from '../../../src/fixtures/test.fixtures';
import { notePayload } from '../../../src/helpers/data.factory';

test.describe('UI Notes / sort', () => {
  test('sort by title A-Z updates the list order', { tag: '@p1' }, async ({
    notesPage,
    notesClient,
    registeredUser,
  }) => {
    const prefix = `ui-sort-${Date.now()}`;
    for (const title of [`${prefix}-c`, `${prefix}-a`, `${prefix}-b`]) {
      expect(
        (
          await notesClient.create(registeredUser.token, notePayload({ title, content: 'x' }))
        ).status(),
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
