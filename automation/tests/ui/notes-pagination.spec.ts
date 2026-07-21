import { test, expect, annotateKnownIssue } from '../../src/fixtures/test.fixtures';
import { notePayload } from '../../src/helpers/data.factory';

test.describe('UI Notes pagination', () => {
  test('splits notes across pages and exposes known counter/next issues', { tag: '@p1' }, async ({
    app,
    page,
    notesClient,
    registeredUser,
  }) => {
    annotateKnownIssue(5, 'UI counter shows page slice instead of real total');
    annotateKnownIssue(6, 'Next can stay enabled on a full last page');

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

    await app.openAuthenticated(registeredUser.token);
    await app.expectAuthenticated();
    await app.searchNotes(prefix);
    await app.setPageSize('5');

    await expect(page.locator('.note-item')).toHaveCount(5);
    await expect(app.listTotal()).toContainText(/notes/i);
    await expect(app.nextPageButton()).toBeEnabled();

    await app.nextPage();
    await expect(page.locator('.note-item')).toHaveCount(2);
    await expect(app.pageInfo()).toContainText(/Page 2/i);
  });

  test('exact page-size multiple can open an empty next page (known issue)', { tag: '@p1' }, async ({
    app,
    page,
    notesClient,
    registeredUser,
  }) => {
    annotateKnownIssue(6, 'Next enabled on full last page leads to empty page');

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

    await app.openAuthenticated(registeredUser.token);
    await app.searchNotes(prefix);
    await app.setPageSize('5');
    await expect(page.locator('.note-item')).toHaveCount(5);
    await expect(app.nextPageButton()).toBeEnabled();

    await app.nextPage();
    await expect(page.locator('.note-item')).toHaveCount(0);
    await expect(page.getByText('No notes found.')).toBeVisible();
  });
});
