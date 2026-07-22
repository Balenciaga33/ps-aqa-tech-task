import { test, expect, annotateKnownIssue } from '../../../src/fixtures/test.fixtures';

test.describe('API Notes / validation', () => {
  const createRejectionCases = [
    {
      name: 'empty title and content',
      payload: { title: '', content: '' },
      status: 422,
    },
    {
      name: 'empty title only',
      payload: { title: '', content: 'body' },
      status: 422,
    },
    {
      name: 'empty content only',
      payload: { title: 'title-only', content: '' },
      status: 422,
    },
    {
      name: 'title longer than 255 characters',
      payload: { title: 't'.repeat(256), content: 'within limit' },
      status: 422,
    },
    {
      name: 'content longer than 10000 characters',
      payload: { title: 'content-bound', content: 'c'.repeat(10001) },
      status: 422,
    },
  ] as const;

  for (const { name, payload, status } of createRejectionCases) {
    test(`create rejects ${name}`, { tag: '@p1' }, async ({ notesClient, registeredUser }) => {
      const response = await notesClient.create(registeredUser.token, payload);
      expect(response.status()).toBe(status);
    });
  }

  const createAcceptanceCases = [
    {
      name: 'title at 255 character boundary',
      payload: { title: 't'.repeat(255), content: 'within limit' },
      assert: async (body: { title: string }) => {
        expect(body.title).toHaveLength(255);
      },
    },
    {
      name: 'content at 10000 character boundary',
      payload: { title: 'content-ok', content: 'c'.repeat(10000) },
      assert: async (body: { content: string }) => {
        expect(body.content).toHaveLength(10000);
      },
    },
    {
      name: 'title with surrounding whitespace trimmed',
      payload: { title: '  padded-title  ', content: 'body' },
      assert: async (body: { title: string }) => {
        expect(body.title).toBe('padded-title');
      },
    },
  ] as const;

  for (const { name, payload, assert } of createAcceptanceCases) {
    test(`create accepts ${name}`, { tag: '@p1' }, async ({ notesClient, registeredUser }) => {
      const response = await notesClient.create(registeredUser.token, payload);
      expect(response.status()).toBe(201);
      await assert(await response.json());
    });
  }

  test('accepts whitespace-only content unlike title (known issue)', { tag: '@p1' }, async ({
    notesClient,
    registeredUser,
  }) => {
    annotateKnownIssue('D2', 'content accepts whitespace-only / is not trimmed');

    const blankLooking = await notesClient.create(registeredUser.token, {
      title: 'blank-looking-content',
      content: '   ',
    });
    expect(blankLooking.status()).toBe(201);
    expect((await blankLooking.json()).content).toBe('   ');

    const padded = await notesClient.create(registeredUser.token, {
      title: 'padded-content',
      content: '  hello  ',
    });
    expect(padded.status()).toBe(201);
    expect((await padded.json()).content).toBe('  hello  ');
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
    expect(response.status()).toBe(400);
  });

  test('JSON-LD Accept on notes list returns 500 (known issue)', { tag: '@p1' }, async ({
    request,
    registeredUser,
  }) => {
    annotateKnownIssue('C3', 'Accept application/ld+json yields 500 instead of 406');

    const response = await request.get('/api/notes', {
      headers: {
        Authorization: `Bearer ${registeredUser.token}`,
        Accept: 'application/ld+json',
      },
    });
    expect(response.status()).toBe(500);
    expect(await response.text()).toMatch(/jsonld|Serialization/i);
  });
});
