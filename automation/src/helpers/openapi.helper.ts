import type { APIRequestContext } from '@playwright/test';

export type OpenApiDocument = {
  paths?: Record<string, Record<string, { responses?: Record<string, unknown> }>>;
};

export async function fetchOpenApiDoc(request: APIRequestContext): Promise<OpenApiDocument> {
  const response = await request.get('/api/doc.json');
  if (response.status() !== 200) {
    throw new Error(`Expected /api/doc.json 200, got ${response.status()}`);
  }
  return (await response.json()) as OpenApiDocument;
}

export function documentedStatusCodes(
  doc: OpenApiDocument,
  path: string,
  method: string,
): string[] {
  const operation = doc.paths?.[path]?.[method.toLowerCase()];
  if (!operation) {
    throw new Error(`OpenAPI missing ${method.toUpperCase()} ${path}`);
  }
  return Object.keys(operation.responses ?? {}).sort();
}

export function assertOperationExists(doc: OpenApiDocument, path: string, method: string): void {
  documentedStatusCodes(doc, path, method);
}
