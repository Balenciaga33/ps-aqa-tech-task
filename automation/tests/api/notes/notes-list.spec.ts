import { test, expect, annotateKnownIssue } from '../../../src/fixtures/test.fixtures';
import { notePayload } from '../../../src/helpers/data.factory';

test.describe('API Notes / list', () => {
  test('list supports search and pagination', { tag: '@p1' }, async ({
    notesClient,
    registeredUser,
  }) => {
    annotateKnownIssue('P1', 'list returns bare JSON array without total metadata');
    const marker = `search-${Date.now()}`;

    for (let i = 0; i < 6; i += 1) {
      const response = await notesClient.create(
        registeredUser.token,
        notePayload({
          title: i < 3 ? `${marker}-match-${i}` : `other-${i}`,
          content: `content-${i}`,
        }),
      );
      expect(response.status()).toBe(201);
    }

    const searchResponse = await notesClient.list(registeredUser.token, {
      q: marker,
      itemsPerPage: 10,
    });
    expect(searchResponse.status()).toBe(200);
    const members = notesClient.extractMembers(await searchResponse.json());
    expect(members).toHaveLength(3);
    expect(members.every((note) => note.title.includes(marker))).toBeTruthy();

    const page1Members = notesClient.extractMembers(
      await (await notesClient.list(registeredUser.token, { page: 1, itemsPerPage: 2 })).json(),
    );
    const page2Members = notesClient.extractMembers(
      await (await notesClient.list(registeredUser.token, { page: 2, itemsPerPage: 2 })).json(),
    );
    expect(page1Members).toHaveLength(2);
    expect(page2Members).toHaveLength(2);
    expect(page2Members.map((note) => note.id)).not.toEqual(page1Members.map((note) => note.id));
  });

  test('list supports sort by title', { tag: '@p1' }, async ({ notesClient, registeredUser }) => {
    const prefix = `sort-${Date.now()}`;
    for (const title of [`${prefix}-c`, `${prefix}-a`, `${prefix}-b`]) {
      expect(
        (
          await notesClient.create(registeredUser.token, notePayload({ title, content: 'sorted' }))
        ).status(),
      ).toBe(201);
    }

    const response = await notesClient.list(registeredUser.token, {
      title: prefix,
      'sort[title]': 'asc',
      itemsPerPage: 10,
    });
    expect(response.status()).toBe(200);
    const titles = notesClient.extractMembers(await response.json()).map((note) => note.title);
    expect(titles).toEqual([`${prefix}-a`, `${prefix}-b`, `${prefix}-c`]);
  });

  test('search title and content filters match their fields only', { tag: '@p1' }, async ({
    notesClient,
    registeredUser,
  }) => {
    const marker = `field-${Date.now()}`;
    expect(
      (
        await notesClient.create(registeredUser.token, {
          title: `${marker}-in-title`,
          content: 'plain body',
        })
      ).status(),
    ).toBe(201);
    expect(
      (
        await notesClient.create(registeredUser.token, {
          title: 'plain-title',
          content: `${marker}-in-content`,
        })
      ).status(),
    ).toBe(201);

    const byTitle = notesClient.extractMembers(
      await (await notesClient.list(registeredUser.token, { title: marker })).json(),
    );
    expect(byTitle).toHaveLength(1);
    expect(byTitle[0].title).toContain(marker);

    const byContent = notesClient.extractMembers(
      await (await notesClient.list(registeredUser.token, { content: marker })).json(),
    );
    expect(byContent).toHaveLength(1);
    expect(byContent[0].content).toContain(marker);
  });
});
