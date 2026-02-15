import React from 'react';

interface ResultCardProps {
  title: string;
  value: string;
}

export function ResultCard({ title, value }: ResultCardProps) {
  return (
    <article
      style={{
        background: 'rgba(255,255,255,0.88)',
        borderRadius: 16,
        padding: 16,
        border: '1px solid rgba(23,32,42,0.12)'
      }}
    >
      <p style={{ margin: 0, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' }}>{title}</p>
      <p style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 700 }}>{value}</p>
    </article>
  );
}
