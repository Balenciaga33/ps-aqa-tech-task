import { z } from 'zod';
import { expect } from '@playwright/test';

const uuid = z.string().uuid();
const nonEmpty = z.string().min(1);

export const signupResponseSchema = z.object({
  message: nonEmpty,
});

export const tokenResponseSchema = z.object({
  token: nonEmpty,
  message: z.string().optional(),
});

export const meResponseSchema = z.object({
  id: uuid,
  email: z.string().email(),
});

export const apiErrorSchema = z.object({
  error: nonEmpty,
});

export const noteSchema = z.object({
  id: uuid,
  title: z.string(),
  content: z.string(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1),
});

export const notesListSchema = z.array(noteSchema);

export function parseSchema<T>(schema: z.ZodType<T>, payload: unknown, label: string): T {
  const result = schema.safeParse(payload);
  expect(result.success, `${label} schema mismatch: ${formatZodError(result)}`).toBeTruthy();
  if (!result.success) {
    throw new Error(`${label} schema mismatch`);
  }
  return result.data;
}

function formatZodError(result: z.SafeParseReturnType<unknown, unknown>): string {
  if (result.success) {
    return '';
  }
  return result.error.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}
