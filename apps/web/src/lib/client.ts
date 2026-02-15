import { PuzzleboxClient } from '@puzzlebox/sdk';

export function createClient() {
  return new PuzzleboxClient({
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
    tenant: import.meta.env.VITE_TENANT ?? 'demo'
  });
}
