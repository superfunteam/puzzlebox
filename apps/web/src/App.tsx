import React, { useMemo } from 'react';
import { createClient } from './lib/client';
import { useWhoSays } from './hooks/useWhoSays';
import { ResultCard } from './components/ResultCard';

export function App() {
  const client = useMemo(() => createClient(), []);
  const { loading, error, round, result, complete, answer, remaining } = useWhoSays(client);

  return (
    <main
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '40px 20px 64px',
        display: 'grid',
        gap: 16
      }}
    >
      <header>
        <h1 style={{ margin: 0, fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}>Who Says?</h1>
        <p style={{ margin: '12px 0 0', maxWidth: 520 }}>
          A reference Puzzlebox game experience for daily newsroom play. Answer, learn, and keep your streak alive.
        </p>
      </header>

      {loading && <p>Loading today&apos;s edition...</p>}
      {error && <p style={{ color: '#a82323' }}>Error: {error}</p>}

      {round && !complete && (
        <section
          style={{
            background: 'var(--card)',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 20px 45px rgba(23, 32, 42, 0.1)'
          }}
        >
          <p style={{ marginTop: 0, fontWeight: 600 }}>Rounds left: {remaining}</p>
          <h2 style={{ marginTop: 0 }}>{round.prompt}</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {round.options.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => answer(option.key)}
                style={{
                  textAlign: 'left',
                  background: '#17202a',
                  color: '#fff',
                  border: 0,
                  borderRadius: 12,
                  padding: '12px 14px',
                  cursor: 'pointer'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {result && !complete && (
        <ResultCard
          title="Last answer"
          value={result.is_correct === true ? 'Correct' : result.is_correct === false ? 'Incorrect' : 'Recorded'}
        />
      )}

      {complete && (
        <section
          style={{
            background: '#17202a',
            color: '#fff',
            borderRadius: 20,
            padding: 24,
            display: 'grid',
            gap: 12
          }}
        >
          <h2 style={{ margin: 0 }}>Daily run complete</h2>
          <p style={{ margin: 0 }}>Score: {String(complete.score)}/{String(complete.max_score)}</p>
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              background: 'rgba(255,255,255,0.12)',
              borderRadius: 12,
              padding: 12
            }}
          >
            {complete.share_data.share_text}
          </pre>
        </section>
      )}
    </main>
  );
}
