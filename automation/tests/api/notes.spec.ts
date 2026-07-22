import { test, expect, annotateKnownIssue } from '../../src/fixtures/test.fixtures';
import { notePayload } from '../../src/helpers/data.factory';
import { noteSchema, parseSchema } from '../../src/schemas/api.schemas';

test.describe('API Notes', () => {
  test('CRUD lifecycle for authenticated user', { tag: '@p0' }, async ({
    notesClient,
    registeredUser,
  }) => {
    annotateKnownIssue(3, 'PUT resets created_at (immutability not asserted)');
    const payload = notePayload();

    const createResponse = await notesClient.create(registeredUser.token, payload);
    expect(createResponse.status()).toBe(201);
    const created = parseSchema(noteSchema, await createResponse.json(), 'create note');
    expect(created.title).toBe(payload.title);
    expect(created.content).toBe(payload.content);

    const getResponse = await notesClient.get(registeredUser.token, created.id);
    expect(getResponse.status()).toBe(200);
    const fetched = parseSchema(noteSchema, await getResponse.json(), 'get note');
    expect(fetched.id).toBe(created.id);

    const updatedPayload = notePayload({ title: `${payload.title} updated` });
    const updateResponse = await notesClient.update(
      registeredUser.token,
      created.id,
      updatedPayload,
    );
    expect(updateResponse.status()).toBe(200);
    const updated = parseSchema(noteSchema, await updateResponse.json(), 'update note');
    expect(updated.title).toBe(updatedPayload.title);
    expect(updated.content).toBe(updatedPayload.content);

    const deleteResponse = await notesClient.delete(registeredUser.token, created.id);
    expect([200, 204]).toContain(deleteResponse.status());

    const missing = await notesClient.get(registeredUser.token, created.id);
    expect(missing.status()).toBe(404);
  });

  test('list supports search and pagination', { tag: '@p1' }, async ({
    notesClient,
    registeredUser,
  }) => {
    annotateKnownIssue(4, 'list returns bare JSON array without total metadata');
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
        (await notesClient.create(registeredUser.token, notePayload({ title, content: 'sorted' }))).status(),
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

  test('notes endpoints require authentication', { tag: '@p0' }, async ({ request }) => {
    annotateKnownIssue(2, 'unauthenticated notes calls return 401 not documented 403');
    expect((await request.get('/api/notes')).status()).toBe(401);
    expect((await request.post('/api/notes', { data: notePayload() })).status()).toBe(401);
    expect((await request.get('/api/notes/00000000-0000-4000-8000-000000000000')).status()).toBe(401);
  });

  test('rejects empty title and content with 422', { tag: '@p1' }, async ({
    notesClient,
    registeredUser,
  }) => {
    const response = await notesClient.create(registeredUser.token, { title: '', content: '' });
    expect(response.status()).toBe(422);
  });

  test('trims surrounding whitespace from the title', { tag: '@p1' }, async ({
    notesClient,
    registeredUser,
  }) => {
    const response = await notesClient.create(registeredUser.token, {
      title: '  padded-title  ',
      content: 'body',
    });
    expect(response.status()).toBe(201);
    expect((await response.json()).title).toBe('padded-title');
  });

  test('rejects a request body that is not valid JSON', { tag: '@p1' }, async ({
    request,
    registeredUser,
  }) => {
    const response = await request.post('/api/notes', {
      headers: {
        Authorization: `Bearer ${registeredUser.token}`,
        'Content-Type': 'application/json',
      },
      data: '{not-valid-json',
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('enforces title length boundary at 255 characters', { tag: '@p1' }, async ({
    notesClient,
    registeredUser,
  }) => {
    const okTitle = 't'.repeat(255);
    const tooLong = 't'.repeat(256);

    const accepted = await notesClient.create(registeredUser.token, {
      title: okTitle,
      content: 'within limit',
    });
    expect(accepted.status()).toBe(201);
    expect((await accepted.json()).title).toHaveLength(255);

    const rejected = await notesClient.create(registeredUser.token, {
      title: tooLong,
      content: 'within limit',
    });
    expect(rejected.status()).toBe(422);
  });

  test('enforces content max length of 10000 characters', { tag: '@p1' }, async ({
    notesClient,
    registeredUser,
  }) => {
    const rejected = await notesClient.create(registeredUser.token, {
      title: 'content-bound',
      content: 'c'.repeat(10001),
    });
    expect(rejected.status()).toBe(422);
  });

  test('returns 404 for a missing note id', { tag: '@p1' }, async ({
    notesClient,
    registeredUser,
  }) => {
    const missingId = '00000000-0000-4000-8000-000000000099';
    expect((await notesClient.get(registeredUser.token, missingId)).status()).toBe(404);
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

  test('user cannot access another user notes', { tag: '@p0' }, async ({
    notesClient,
    authHelper,
    registeredUser,
  }) => {
    const stranger = await authHelper.registerVerifiedUser();
    const createResponse = await notesClient.create(
      registeredUser.token,
      notePayload({ title: 'private-note' }),
    );
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();

    expect((await notesClient.get(stranger.token, created.id)).status()).toBe(404);
    expect((await notesClient.update(stranger.token, created.id, notePayload())).status()).toBe(404);
    expect((await notesClient.delete(stranger.token, created.id)).status()).toBe(404);

    const strangerNotes = notesClient.extractMembers(
      await (await notesClient.list(stranger.token)).json(),
    );
    expect(strangerNotes.find((note) => note.id === created.id)).toBeUndefined();
    expect((await notesClient.get(registeredUser.token, created.id)).status()).toBe(200);
  });
});
