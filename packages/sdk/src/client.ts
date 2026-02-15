import type { PuzzleboxClientConfig, RequestOptions } from './types';

export class PuzzleboxClient {
  private readonly baseUrl: string;
  private readonly tenant: string;
  private jwt: string | undefined;
  private apiKey: string | undefined;

  constructor(config: PuzzleboxClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.tenant = config.tenant;
    this.jwt = config.jwt;
    this.apiKey = config.apiKey;
  }

  setJwt(jwt: string) {
    this.jwt = jwt;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, init: RequestInit = {}, options: RequestOptions = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('X-Tenant', this.tenant);
    headers.set('Content-Type', 'application/json');

    const jwt = options.jwt ?? this.jwt;
    if (jwt) headers.set('Authorization', `Bearer ${jwt}`);

    const apiKey = options.apiKey ?? this.apiKey;
    if (apiKey) headers.set('X-API-Key', apiKey);

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers
    });

    const payload = await response.json();
    if (!response.ok) {
      const message = (payload?.error as string | undefined) ?? `HTTP ${response.status}`;
      throw new Error(message);
    }

    return payload as T;
  }

  async authAnonymous(input: { timezone?: string } = {}) {
    const payload = await this.request<{ jwt: string; player_id: string }>('/api/v1/auth/anonymous', {
      method: 'POST',
      body: JSON.stringify(input)
    });

    this.jwt = payload.jwt;
    return payload;
  }

  async listGames() {
    return this.request<{ games: Array<Record<string, unknown>> }>('/api/v1/games');
  }

  async getToday(slug: string) {
    return this.request<Record<string, unknown>>(`/api/v1/games/${slug}/today`);
  }

  async startSession(editionId: string) {
    return this.request<{ session_id: string }>('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify({ edition_id: editionId })
    });
  }

  async respond(sessionId: string, input: { round_id: string; answer: Record<string, unknown> }) {
    return this.request<Record<string, unknown>>(`/api/v1/sessions/${sessionId}/respond`, {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  async completeSession(sessionId: string) {
    return this.request<Record<string, unknown>>(`/api/v1/sessions/${sessionId}/complete`, {
      method: 'POST'
    });
  }

  async createGame(input: Record<string, unknown>) {
    return this.request<Record<string, unknown>>('/api/v1/games', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  async createEdition(slug: string, input: Record<string, unknown>) {
    return this.request<Record<string, unknown>>(`/api/v1/games/${slug}/editions`, {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  async analyticsOverview() {
    return this.request<Record<string, unknown>>('/api/v1/analytics/overview');
  }
}
