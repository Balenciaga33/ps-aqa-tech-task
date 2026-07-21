export const config = {
  baseUrl: process.env.BASE_URL ?? 'http://localhost:4444',
  apiUrl: process.env.API_URL ?? process.env.BASE_URL ?? 'http://localhost:4444',
  mailhogUrl: process.env.MAILHOG_URL ?? 'http://localhost:8025',
};
