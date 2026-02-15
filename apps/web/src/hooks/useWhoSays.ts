import { useEffect, useMemo, useState } from 'react';
import type { PuzzleboxClient } from '@puzzlebox/sdk';

interface RoundView {
  id: string;
  prompt: string;
  options: Array<{ key: string; label: string }>;
}

export function useWhoSays(client: PuzzleboxClient) {
  const [loading, setLoading] = useState(true);
  const [editionId, setEditionId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [rounds, setRounds] = useState<RoundView[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [complete, setComplete] = useState<Record<string, unknown> | null>(null);
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

        const todayRounds = (today.rounds as RoundView[]) ?? [];
        setEditionId(today.edition_id as string);
        setRounds(todayRounds);

        const session = await client.startSession(today.edition_id as string);
        if (!active) return;
        setSessionId(session.session_id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unexpected error';
        setError(message);
      } finally {
        setLoading(false);
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
  }

  return {
    loading,
    error,
    editionId,
    round,
    result,
    complete,
    answer,
    remaining: rounds.length - currentRound
  };
}
