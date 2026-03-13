import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PuzzleboxClient } from './client';
import { PuzzleboxApiError } from './types';

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
});

describe('PuzzleboxClient', () => {
  it('adds tenant header and parses response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify({ games: [] })
    });

    const client = new PuzzleboxClient({ baseUrl: 'http://localhost:3000', tenant: 'demo' });
    const result = await client.listGames();

    expect(result.games).toEqual([]);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/api/v1/games');
    const headers = init.headers as Headers;
    expect(headers.get('X-Tenant')).toBe('demo');
  });

  it('throws structured API errors with payload access', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      text: async () =>
        JSON.stringify({
          error: 'session_exists',
          existing_session: {
            id: 'session-id'
          }
        })
    });

    const client = new PuzzleboxClient({ baseUrl: 'http://localhost:3000', tenant: 'demo' });

    await expect(client.startSession('edition-id')).rejects.toEqual(
      expect.objectContaining<PuzzleboxApiError>({
        name: 'PuzzleboxApiError',
        message: 'session_exists',
        status: 409,
        payload: expect.objectContaining({
          error: 'session_exists'
        })
      })
    );
  });
});
