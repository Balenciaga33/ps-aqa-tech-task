import { APIRequestContext, APIResponse } from '@playwright/test';

export type NoteInput = {
  title: string;
  content: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
};

export class NotesClient {
  constructor(private readonly request: APIRequestContext) {}

  private authHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  async create(token: string, note: NoteInput): Promise<APIResponse> {
    return this.request.post('/api/notes', {
      headers: this.authHeaders(token),
      data: note,
    });
  }

  async get(token: string, id: string): Promise<APIResponse> {
    return this.request.get(`/api/notes/${id}`, {
      headers: this.authHeaders(token),
    });
  }

  async update(token: string, id: string, note: NoteInput): Promise<APIResponse> {
    return this.request.put(`/api/notes/${id}`, {
      headers: this.authHeaders(token),
      data: note,
    });
  }

  async delete(token: string, id: string): Promise<APIResponse> {
    return this.request.delete(`/api/notes/${id}`, {
      headers: this.authHeaders(token),
    });
  }

  async list(
    token: string,
    params: Record<string, string | number> = {},
  ): Promise<APIResponse> {
    return this.request.get('/api/notes', {
      headers: this.authHeaders(token),
      params,
    });
  }

  extractMembers(payload: unknown): Note[] {
    if (Array.isArray(payload)) {
      return payload as Note[];
    }

    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      if (Array.isArray(record['hydra:member'])) {
        return record['hydra:member'] as Note[];
      }
      if (Array.isArray(record.member)) {
        return record.member as Note[];
      }
    }

    return [];
  }

  extractTotal(payload: unknown): number {
    if (Array.isArray(payload)) {
      return payload.length;
    }

    if (payload && typeof payload === 'object') {
      const record = payload as Record<string, unknown>;
      const hydraTotal = Number(record['hydra:totalItems']);
      if (Number.isFinite(hydraTotal)) {
        return hydraTotal;
      }
      const plainTotal = Number(record.totalItems);
      if (Number.isFinite(plainTotal)) {
        return plainTotal;
      }
    }

    return 0;
  }
}
