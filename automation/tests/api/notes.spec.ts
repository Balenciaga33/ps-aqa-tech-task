import { test, expect } from '@playwright/test';
import { NotesClient } from '../../src/clients/notes.client';
import { AuthHelper } from '../../src/helpers/auth.helper';
import { notePayload } from '../../src/helpers/data.factory';

test.describe('API Notes', () => {
  test('CRUD lifecycle for authenticated user', async ({ request }) => {
    const notes = new NotesClient(request);
    const helper = new AuthHelper(request);
    const user = await helper.registerVerifiedUser();
    const payload = notePayload();

    const createResponse = await notes.create(user.token, payload);
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();
    expect(created.id).toEqual(expect.any(String));
    expect(created.title).toBe(payload.title);
    expect(created.content).toBe(payload.content);

    const getResponse = await notes.get(user.token, created.id);
    expect(getResponse.status()).toBe(200);
    const fetched = await getResponse.json();
    expect(fetched.id).toBe(created.id);

    const updatedPayload = notePayload({ title: `${payload.title} updated` });
    const updateResponse = await notes.update(user.token, created.id, updatedPayload);
    expect(updateResponse.status()).toBe(200);
    const updated = await updateResponse.json();
    expect(updated.title).toBe(updatedPayload.title);
    expect(updated.content).toBe(updatedPayload.content);

    const deleteResponse = await notes.delete(user.token, created.id);
    expect([200, 204]).toContain(deleteResponse.status());

    const missing = await notes.get(user.token, created.id);
    expect([404, 403]).toContain(missing.status());
  });

  test('list supports search and pagination', async ({ request }) => {
    const notes = new NotesClient(request);
    const helper = new AuthHelper(request);
    const user = await helper.registerVerifiedUser();
    const marker = `search-${Date.now()}`;

    for (let i = 0; i < 6; i += 1) {
      const response = await notes.create(
        user.token,
        notePayload({
          title: i < 3 ? `${marker}-match-${i}` : `other-${i}`,
          content: `content-${i}`,
        }),
      );
      expect(response.status()).toBe(201);
    }

    const searchResponse = await notes.list(user.token, { q: marker, itemsPerPage: 10 });
    expect(searchResponse.status()).toBe(200);
    const searchBody = await searchResponse.json();
    const members = notes.extractMembers(searchBody);
    expect(members.length).toBe(3);
    expect(members.every((note) => note.title.includes(marker))).toBeTruthy();

    const page1Response = await notes.list(user.token, { page: 1, itemsPerPage: 2 });
    expect(page1Response.status()).toBe(200);
    const page1Members = notes.extractMembers(await page1Response.json());
    expect(page1Members).toHaveLength(2);

    const page2Response = await notes.list(user.token, { page: 2, itemsPerPage: 2 });
    expect(page2Response.status()).toBe(200);
    const page2Members = notes.extractMembers(await page2Response.json());
    expect(page2Members).toHaveLength(2);
    expect(page2Members.map((note) => note.id)).not.toEqual(page1Members.map((note) => note.id));
  });

  test('list supports sort by title', async ({ request }) => {
    const notes = new NotesClient(request);
    const helper = new AuthHelper(request);
    const user = await helper.registerVerifiedUser();
    const prefix = `sort-${Date.now()}`;

    for (const title of [`${prefix}-c`, `${prefix}-a`, `${prefix}-b`]) {
      const response = await notes.create(user.token, notePayload({ title, content: 'sorted' }));
      expect(response.status()).toBe(201);
    }

    const response = await notes.list(user.token, {
      title: prefix,
      'sort[title]': 'asc',
      itemsPerPage: 10,
    });
    expect(response.status()).toBe(200);
    const titles = notes.extractMembers(await response.json()).map((note) => note.title);
    expect(titles).toEqual([`${prefix}-a`, `${prefix}-b`, `${prefix}-c`]);
  });

  test('notes endpoints require authentication', async ({ request }) => {
    const listResponse = await request.get('/api/notes');
    expect(listResponse.status()).toBe(401);

    const createResponse = await request.post('/api/notes', {
      data: notePayload(),
    });
    expect(createResponse.status()).toBe(401);
  });

  test('user cannot access another user notes', async ({ request }) => {
    const notes = new NotesClient(request);
    const helper = new AuthHelper(request);
    const owner = await helper.registerVerifiedUser();
    const stranger = await helper.registerVerifiedUser();

    const createResponse = await notes.create(owner.token, notePayload({ title: 'private-note' }));
    expect(createResponse.status()).toBe(201);
    const created = await createResponse.json();

    const strangerGet = await notes.get(stranger.token, created.id);
    expect([404, 403]).toContain(strangerGet.status());

    const strangerUpdate = await notes.update(stranger.token, created.id, notePayload());
    expect([404, 403]).toContain(strangerUpdate.status());

    const strangerDelete = await notes.delete(stranger.token, created.id);
    expect([404, 403]).toContain(strangerDelete.status());

    const strangerList = await notes.list(stranger.token);
    expect(strangerList.status()).toBe(200);
    const strangerNotes = notes.extractMembers(await strangerList.json());
    expect(strangerNotes.find((note) => note.id === created.id)).toBeUndefined();

    const ownerGet = await notes.get(owner.token, created.id);
    expect(ownerGet.status()).toBe(200);
  });
});
