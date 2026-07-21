import { test, expect, annotateKnownIssue } from '../../src/fixtures/test.fixtures';
import { notePayload } from '../../src/helpers/data.factory';

test.describe('API Notes', () => {
  test('CRUD lifecycle for authenticated user', async ({ notesClient, registeredUser }) => {
    annotateKnownIssue(3, 'PUT resets created_at (immutability not asserted)');
    const payload = notePayload();

    const createResponse = await notesClient.create(registeredUser.token, payload);
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    expect(created.id).toEqual(expect.any(String));
    expect(created.title).toBe(payload.title);
    expect(created.content).toBe(payload.content);
    expect(created.created_at).toEqual(expect.any(String));
    expect(created.updated_at).toEqual(expect.any(String));

    const getResponse = await notesClient.get(registeredUser.token, created.id);
    expect(getResponse.status()).toBe(200);
    expect((await getResponse.json()).id).toBe(created.id);

    const updatedPayload = notePayload({ title: `${payload.title} updated` });
    const updateResponse = await notesClient.update(
      registeredUser.token,
      created.id,
      updatedPayload,
    );
    expect(updateResponse.status()).toBe(200);
    const updated = await updateResponse.json();
    expect(updated.title).toBe(updatedPayload.title);
    expect(updated.content).toBe(updatedPayload.content);
    // Intentionally not asserting created_at stability — see FINDINGS.md #3

    const deleteResponse = await notesClient.delete(registeredUser.token, created.id);
    expect([200, 204]).toContain(deleteResponse.status());

    const missing = await notesClient.get(registeredUser.token, created.id);
    expect(missing.status()).toBe(404);
  });

  test('list supports search and pagination', async ({ notesClient, registeredUser }) => {
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

  test('list supports sort by title', async ({ notesClient, registeredUser }) => {
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

  test('notes endpoints require authentication', async ({ request }) => {
    annotateKnownIssue(2, 'unauthenticated notes calls return 401 not documented 403');
    expect((await request.get('/api/notes')).status()).toBe(401);
    expect((await request.post('/api/notes', { data: notePayload() })).status()).toBe(401);
    expect((await request.get('/api/notes/00000000-0000-4000-8000-000000000000')).status()).toBe(401);
  });

  test('rejects empty title and content with 422', async ({ notesClient, registeredUser }) => {
    const response = await notesClient.create(registeredUser.token, { title: '', content: '' });
    expect(response.status()).toBe(422);
  });

  test('user cannot access another user notes', async ({ notesClient, authHelper, registeredUser }) => {
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
