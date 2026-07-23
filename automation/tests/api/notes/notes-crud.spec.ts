import { test, expect, annotateKnownIssue } from '../../../src/fixtures/test.fixtures';
import { notePayload } from '../../../src/helpers/data.factory';
import { noteSchema, parseSchema } from '../../../src/schemas/api.schemas';

test.describe('API Notes / CRUD', () => {
  test('CRUD lifecycle for authenticated user', { tag: '@p0' }, async ({
    notesClient,
    registeredUser,
  }) => {
    annotateKnownIssue('D1', 'PUT resets created_at (immutability not asserted)');
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

  test('returns 404 for a missing note id', { tag: '@p1' }, async ({
    notesClient,
    registeredUser,
  }) => {
    const missingId = '00000000-0000-4000-8000-000000000099';
    expect((await notesClient.get(registeredUser.token, missingId)).status()).toBe(404);
  });
});
