import { randomUUID } from 'crypto';

export function uniqueEmail(prefix = 'user'): string {
  return `${prefix}.${Date.now()}.${randomUUID().slice(0, 8)}@example.com`;
}

export function defaultPassword(): string {
  return 'Secret123!';
}

export function notePayload(overrides: Partial<{ title: string; content: string }> = {}) {
  const id = randomUUID().slice(0, 8);
  return {
    title: overrides.title ?? `Note title ${id}`,
    content: overrides.content ?? `Note content ${id}`,
  };
}
