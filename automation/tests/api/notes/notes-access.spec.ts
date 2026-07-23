import { test, expect, annotateKnownIssue } from '../../../src/fixtures/test.fixtures';
import { notePayload } from '../../../src/helpers/data.factory';

test.describe('API Notes / access', () => {
  test('notes endpoints require authentication', { tag: '@p0' }, async ({ request }) => {
    annotateKnownIssue('C2', 'unauthenticated notes calls return 401 not documented 403');
    expect((await request.get('/api/notes')).status()).toBe(401);
    expect((await request.post('/api/notes', { data: notePayload() })).status()).toBe(401);
    expect(
      (await request.get('/api/notes/00000000-0000-4000-8000-000000000000')).status(),
    ).toBe(401);
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
    expect((await notesClient.update(stranger.token, created.id, notePayload())).status()).toBe(
      404,
    );
    expect((await notesClient.delete(stranger.token, created.id)).status()).toBe(404);

    const strangerNotes = notesClient.extractMembers(
      await (await notesClient.list(stranger.token)).json(),
    );
    expect(strangerNotes.find((note) => note.id === created.id)).toBeUndefined();
    expect((await notesClient.get(registeredUser.token, created.id)).status()).toBe(200);
  });
});
