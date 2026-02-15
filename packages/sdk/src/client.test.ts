import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzleboxClient } from './client';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
});

describe('PuzzleboxClient', () => {
  it('adds tenant header and parses response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ games: [] })
    });

    const client = new PuzzleboxClient({ baseUrl: 'http://localhost:3000', tenant: 'demo' });
    const result = await client.listGames();

    expect(result.games).toEqual([]);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/v1/games');
    const headers = init.headers as Headers;
    expect(headers.get('X-Tenant')).toBe('demo');
  });
});
