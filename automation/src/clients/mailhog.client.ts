import { APIRequestContext, expect } from '@playwright/test';
import { config } from '../config';

type MailhogMessage = {
  ID: string;
  Content: {
    Headers: Record<string, string[]>;
    Body: string;
  };
};

type MailhogSearchResponse = {
  total: number;
  count: number;
  start: number;
  items: MailhogMessage[];
};

function decodeQuotedPrintable(input: string): string {
  return input
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

export class MailhogClient {
  constructor(private readonly request: APIRequestContext) {}

  async waitForConfirmationCode(email: string, timeoutMs = 20_000): Promise<string> {
    const deadline = Date.now() + timeoutMs;
    const normalizedEmail = email.toLowerCase();

    while (Date.now() < deadline) {
      const response = await this.request.get(`${config.mailhogUrl}/api/v2/search`, {
        params: {
          kind: 'to',
          query: normalizedEmail,
        },
      });
      expect(response.ok(), `MailHog search failed for ${normalizedEmail}`).toBeTruthy();

      const payload = (await response.json()) as MailhogSearchResponse;
      const message = payload.items?.[0];
      if (message) {
        const body = decodeQuotedPrintable(message.Content.Body);
        const fromQuery = body.match(/confirm_code=(\d{6})/);
        if (fromQuery?.[1]) {
          return fromQuery[1];
        }

        const sixDigits = body.match(/\b(\d{6})\b/);
        if (sixDigits?.[1]) {
          return sixDigits[1];
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(`Confirmation email for ${normalizedEmail} was not found in MailHog within ${timeoutMs}ms`);
  }

  async waitForConfirmationLink(email: string, timeoutMs = 20_000): Promise<string> {
    const deadline = Date.now() + timeoutMs;
    const normalizedEmail = email.toLowerCase();

    while (Date.now() < deadline) {
      const response = await this.request.get(`${config.mailhogUrl}/api/v2/search`, {
        params: {
          kind: 'to',
          query: normalizedEmail,
        },
      });
      expect(response.ok()).toBeTruthy();

      const payload = (await response.json()) as MailhogSearchResponse;
      const message = payload.items?.[0];
      if (message) {
        const body = decodeQuotedPrintable(message.Content.Body);
        const hrefMatch = body.match(/href="([^"]*confirm_email=[^"]+)"/i);
        if (hrefMatch?.[1]) {
          return hrefMatch[1].replace(/&amp;/g, '&');
        }

        const plainMatch = body.match(/(https?:\/\/\S*confirm_email=\S+)/i);
        if (plainMatch?.[1]) {
          return plainMatch[1].trim();
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new Error(`Confirmation link for ${normalizedEmail} was not found in MailHog within ${timeoutMs}ms`);
  }
}
