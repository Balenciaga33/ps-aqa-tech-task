import { test, expect, annotateKnownIssue } from '../../../src/fixtures/test.fixtures';
import {
  assertOperationExists,
  documentedStatusCodes,
  fetchOpenApiDoc,
} from '../../../src/helpers/openapi.helper';

/**
 * Smoke: critical operations exist in /api/doc.json and documented success codes
 * match what the suite asserts (or are explicitly annotated as known drift).
 */
test.describe('API OpenAPI contract smoke', () => {
  const criticalOperations = [
    {
      name: 'signup',
      path: '/api/auth/signup',
      method: 'post',
      documentedSuccess: '201',
    },
    {
      name: 'confirm',
      path: '/api/auth/confirm',
      method: 'post',
      documentedSuccess: '200',
      actualSuccess: '201',
      knownIssue: { id: 'C1', summary: 'confirm returns 201 instead of documented 200' },
    },
    {
      name: 'signin',
      path: '/api/auth/signin',
      method: 'post',
      documentedSuccess: '200',
    },
    {
      name: 'me',
      path: '/api/auth/me',
      method: 'get',
      documentedSuccess: '200',
    },
    {
      name: 'notes collection GET',
      path: '/api/notes',
      method: 'get',
      documentedSuccess: '200',
      documentedUnauth: '403',
      actualUnauth: '401',
      knownIssue: { id: 'C2', summary: 'unauthenticated notes return 401 not documented 403' },
    },
    {
      name: 'notes collection POST',
      path: '/api/notes',
      method: 'post',
      documentedSuccess: '201',
    },
    {
      name: 'note item GET',
      path: '/api/notes/{id}',
      method: 'get',
      documentedSuccess: '200',
    },
    {
      name: 'note item PUT',
      path: '/api/notes/{id}',
      method: 'put',
      documentedSuccess: '200',
    },
    {
      name: 'note item DELETE',
      path: '/api/notes/{id}',
      method: 'delete',
      documentedSuccess: '204',
    },
  ] as const;

  test('critical paths exist with expected documented statuses', { tag: '@p0' }, async ({
    request,
  }) => {
    const doc = await fetchOpenApiDoc(request);

    for (const op of criticalOperations) {
      assertOperationExists(doc, op.path, op.method);
      const codes = documentedStatusCodes(doc, op.path, op.method);
      expect(codes, `${op.name} should document ${op.documentedSuccess}`).toContain(
        op.documentedSuccess,
      );

      if ('knownIssue' in op && op.knownIssue) {
        annotateKnownIssue(op.knownIssue.id, op.knownIssue.summary);
      }

      if ('actualSuccess' in op && op.actualSuccess) {
        expect(
          codes,
          `${op.name}: documented success stays ${op.documentedSuccess} (actual runtime ${op.actualSuccess})`,
        ).toContain(op.documentedSuccess);
        expect(op.actualSuccess).not.toBe(op.documentedSuccess);
      }

      if ('documentedUnauth' in op && op.documentedUnauth) {
        expect(codes).toContain(op.documentedUnauth);
        expect(op.actualUnauth).not.toBe(op.documentedUnauth);
      }
    }
  });
});
