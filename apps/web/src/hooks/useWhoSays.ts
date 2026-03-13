import { useEffect, useMemo, useState } from 'react';
import {
  isPuzzleboxApiError,
  type CompleteSessionResponse,
  type PuzzleboxClient,
  type PuzzleboxSession,
  type PuzzleboxShareData,
  type PuzzleboxTodayResponse,
  type RespondResponse,
  type SessionExistsPayload
} from '@puzzlebox/sdk';

interface RoundView {
  id: string;
  prompt: string;
  options: Array<{ key: string; label: string }>;
}

interface CompleteView {
  score: number;
  max_score: number;
  share_data: PuzzleboxShareData;
}

function toCompleteView(session: PuzzleboxSession): CompleteView | null {
  if (session.score === null || session.max_score === null || session.share_data === null) {
    return null;
  }

  return {
    score: session.score,
    max_score: session.max_score,
    share_data: session.share_data
  };
}

async function resolvePlayableSession(client: PuzzleboxClient, today: PuzzleboxTodayResponse): Promise<{
  sessionId: string;
  currentRound: number;
  complete: CompleteView | CompleteSessionResponse | null;
}> {
  const existing = today.existing_session;

  if (existing) {
    const complete = toCompleteView(existing);
    if (complete) {
      return {
        sessionId: existing.id,
        currentRound: today.rounds.length,
        complete
      };
    }

    if (existing.responses.length >= today.rounds.length) {
      const finalized = await client.completeSession(existing.id);
      return {
        sessionId: existing.id,
        currentRound: today.rounds.length,
        complete: finalized
      };
    }

    return {
      sessionId: existing.id,
      currentRound: existing.responses.length,
      complete: null
    };
  }

  try {
    const session = await client.startSession(today.edition_id);
    return {
      sessionId: session.session_id,
      currentRound: 0,
      complete: null
    };
  } catch (error) {
    if (
      isPuzzleboxApiError<SessionExistsPayload>(error) &&
      typeof error.payload === 'object' &&
      error.payload !== null &&
      error.payload.error === 'session_exists'
    ) {
      const resumed = error.payload.existing_session;
      const complete = toCompleteView(resumed);

      return {
        sessionId: resumed.id,
        currentRound: complete ? today.rounds.length : resumed.responses.length,
        complete
      };
    }

    throw error;
  }
}

export function useWhoSays(client: PuzzleboxClient) {
  const [loading, setLoading] = useState(true);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<RoundView[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [result, setResult] = useState<RespondResponse | null>(null);
  const [complete, setComplete] = useState<CompleteView | CompleteSessionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function boot() {
      setLoading(true);
      setError(null);
      try {
        await client.authAnonymous({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
        const today = await client.getToday('who-says');
        if (!active) return;

        const todayRounds = today.rounds as RoundView[];
        setEditionId(today.edition_id);
        setRounds(todayRounds);

        const sessionState = await resolvePlayableSession(client, today);
        if (!active) return;

        setSessionId(sessionState.sessionId);
        setCurrentRound(sessionState.currentRound);
        setComplete(sessionState.complete);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error';
        if (active) setError(message);
      } finally {
        if (active) setLoading(false);
      }
    }

    boot();

    return () => {
      active = false;
    };
  }, [client]);

  const round = useMemo(() => rounds[currentRound] ?? null, [rounds, currentRound]);

  async function answer(key: string) {
    if (!sessionId || !round) return;

    try {
      setError(null);

      const payload = await client.respond(sessionId, {
        round_id: round.id,
        answer: { key }
      });

      setResult(payload);

      if (currentRound + 1 < rounds.length) {
        setCurrentRound((value) => value + 1);
        return;
      }

      const completed = await client.completeSession(sessionId);
      setComplete(completed);
      setCurrentRound(rounds.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
    }
  }

  return {
    loading,
    error,
    editionId,
    round,
    result,
    complete,
    answer,
    remaining: Math.max(rounds.length - currentRound, 0)
  };
}
