import type {
  AnalyticsOverviewResponse,
  AnonymousAuthResponse,
  CompleteSessionResponse,
  CreateEditionRequest,
  CreateEditionResponse,
  CreateGameRequest,
  EditionAnalyticsResponse,
  GameAnalyticsResponse,
  PatchGameRequest,
  PatchMeRequest,
  PuzzleboxClientConfig,
  PuzzleboxEdition,
  PuzzleboxEditionDetail,
  PuzzleboxEditionListResponse,
  PuzzleboxGame,
  PuzzleboxGamesListResponse,
  PuzzleboxPlayer,
  PuzzleboxPlayerListResponse,
  PuzzleboxPlayerStatsResponse,
  PuzzleboxSession,
  PuzzleboxTodayResponse,
  RequestOptions,
  RespondResponse,
  StartSessionResponse
} from './types';
import { PuzzleboxApiError } from './types';

async function parseResponseBody(response: Response): Promise<unknown> {
  const raw = await response.text();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

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
    headers.set('Accept', 'application/json');
    headers.set('X-Tenant', this.tenant);

    if (init.body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const jwt = options.jwt ?? this.jwt;
    if (jwt) headers.set('Authorization', `Bearer ${jwt}`);

    const apiKey = options.apiKey ?? this.apiKey;
    if (apiKey) headers.set('X-API-Key', apiKey);

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers
    });

    const payload = await parseResponseBody(response);
    if (!response.ok) {
      throw new PuzzleboxApiError(response.status, payload);
    }

    return payload as T;
  }

  async authAnonymous(input: { timezone?: string } = {}): Promise<AnonymousAuthResponse> {
    const payload = await this.request<AnonymousAuthResponse>('/api/v1/auth/anonymous', {
      method: 'POST',
      body: JSON.stringify(input)
    });

    this.jwt = payload.jwt;
    return payload;
  }

  async listGames(): Promise<PuzzleboxGamesListResponse> {
    return this.request<PuzzleboxGamesListResponse>('/api/v1/games');
  }

  async getGame(slug: string): Promise<PuzzleboxGame> {
    return this.request<PuzzleboxGame>(`/api/v1/games/${slug}`);
  }

  async patchGame(slug: string, input: PatchGameRequest): Promise<PuzzleboxGame> {
    return this.request<PuzzleboxGame>(`/api/v1/games/${slug}`, {
      method: 'PATCH',
      body: JSON.stringify(input)
    });
  }

  async getToday(slug: string): Promise<PuzzleboxTodayResponse> {
    return this.request<PuzzleboxTodayResponse>(`/api/v1/games/${slug}/today`);
  }

  async startSession(editionId: string): Promise<StartSessionResponse> {
    return this.request<StartSessionResponse>('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify({ edition_id: editionId })
    });
  }

  async getSession(sessionId: string): Promise<PuzzleboxSession> {
    return this.request<PuzzleboxSession>(`/api/v1/sessions/${sessionId}`);
  }

  async respond(sessionId: string, input: { round_id: string; answer: { key: string } | { order: string[] } }): Promise<RespondResponse> {
    return this.request<RespondResponse>(`/api/v1/sessions/${sessionId}/respond`, {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  async completeSession(sessionId: string): Promise<CompleteSessionResponse> {
    return this.request<CompleteSessionResponse>(`/api/v1/sessions/${sessionId}/complete`, {
      method: 'POST'
    });
  }

  async createGame(input: CreateGameRequest): Promise<PuzzleboxGame> {
    return this.request<PuzzleboxGame>('/api/v1/games', {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  async createEdition(slug: string, input: CreateEditionRequest): Promise<CreateEditionResponse> {
    return this.request<CreateEditionResponse>(`/api/v1/games/${slug}/editions`, {
      method: 'POST',
      body: JSON.stringify(input)
    });
  }

  async listEditions(slug: string): Promise<PuzzleboxEditionListResponse> {
    return this.request<PuzzleboxEditionListResponse>(`/api/v1/games/${slug}/editions`);
  }

  async getEdition(editionId: string): Promise<PuzzleboxEditionDetail> {
    return this.request<PuzzleboxEditionDetail>(`/api/v1/editions/${editionId}`);
  }

  async publishEdition(editionId: string): Promise<PuzzleboxEdition> {
    return this.request<PuzzleboxEdition>(`/api/v1/editions/${editionId}/publish`, {
      method: 'POST'
    });
  }

  async analyticsOverview(): Promise<AnalyticsOverviewResponse> {
    return this.request<AnalyticsOverviewResponse>('/api/v1/analytics/overview');
  }

  async getGameAnalytics(slug: string): Promise<GameAnalyticsResponse> {
    return this.request<GameAnalyticsResponse>(`/api/v1/games/${slug}/analytics`);
  }

  async getEditionAnalytics(editionId: string): Promise<EditionAnalyticsResponse> {
    return this.request<EditionAnalyticsResponse>(`/api/v1/editions/${editionId}/analytics`);
  }

  async listPlayers(): Promise<PuzzleboxPlayerListResponse> {
    return this.request<PuzzleboxPlayerListResponse>('/api/v1/players');
  }

  async getMyStats(): Promise<PuzzleboxPlayerStatsResponse> {
    return this.request<PuzzleboxPlayerStatsResponse>('/api/v1/me/stats');
  }

  async updateMe(input: PatchMeRequest): Promise<PuzzleboxPlayer> {
    return this.request<PuzzleboxPlayer>('/api/v1/me', {
      method: 'PATCH',
      body: JSON.stringify(input)
    });
  }
}
