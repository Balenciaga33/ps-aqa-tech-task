import { test, expect, annotateKnownIssue } from '../../../src/fixtures/test.fixtures';
import { notePayload } from '../../../src/helpers/data.factory';

test.describe('UI Notes / pagination', () => {
  test('splits notes across pages and exposes known counter/next issues', { tag: '@p1' }, async ({
    notesPage,
    page,
    notesClient,
    registeredUser,
  }) => {
    annotateKnownIssue('P2', 'UI counter shows page slice instead of real total');
    annotateKnownIssue('P3', 'Next can stay enabled on a full last page');

    const prefix = `page-${Date.now()}`;
    for (let i = 0; i < 7; i += 1) {
      expect(
        (
          await notesClient.create(
            registeredUser.token,
            notePayload({ title: `${prefix}-${i}`, content: `c-${i}` }),
          )
        ).status(),
      ).toBe(201);
    }

    await notesPage.openAuthenticated(registeredUser.token);
    await notesPage.expectAuthenticated();
    await notesPage.searchNotes(prefix);
    await notesPage.setPageSize('5');

    await expect(page.locator('.note-item')).toHaveCount(5);
    await expect(notesPage.listTotal()).toContainText(/notes/i);
    await expect(notesPage.nextPageButton()).toBeEnabled();

    await notesPage.nextPage();
    await expect(page.locator('.note-item')).toHaveCount(2);
    await expect(notesPage.pageInfo()).toContainText(/Page 2/i);
  });

  test('exact page-size multiple can open an empty next page (known issue)', { tag: '@p1' }, async ({
    notesPage,
    page,
    notesClient,
    registeredUser,
  }) => {
    annotateKnownIssue('P3', 'Next enabled on full last page leads to empty page');

    const prefix = `fullpage-${Date.now()}`;
    for (let i = 0; i < 5; i += 1) {
      expect(
        (
          await notesClient.create(
            registeredUser.token,
            notePayload({ title: `${prefix}-${i}`, content: `c-${i}` }),
          )
        ).status(),
      ).toBe(201);
    }

    await notesPage.openAuthenticated(registeredUser.token);
    await notesPage.searchNotes(prefix);
    await notesPage.setPageSize('5');
    await expect(page.locator('.note-item')).toHaveCount(5);
    await expect(notesPage.nextPageButton()).toBeEnabled();

    await notesPage.nextPage();
    await expect(page.locator('.note-item')).toHaveCount(0);
    await expect(page.getByText('No notes found.')).toBeVisible();
  });
});
