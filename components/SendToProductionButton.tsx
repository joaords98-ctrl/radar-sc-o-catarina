'use client';

import { useState } from 'react';

type Props = {
  newsId: string;
  storyKey?: string | null;
  headline?: string | null;
  className?: string;
  children?: React.ReactNode;
};

export function SendToProductionButton({ newsId, storyKey, headline, className, children }: Props) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendToProduction() {
    setLoading(true);
    setError(null);
    setDone(false);

    try {
      const res = await fetch('/api/production/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsId, storyKey, headline }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) throw new Error(data?.error || 'Falha ao enviar para pauta');
      setDone(true);
      setTimeout(() => window.location.reload(), 650);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="contents">
      <button onClick={sendToProduction} disabled={loading || done} className={className ?? 'rounded-xl bg-emerald-500 px-4 py-2 text-center text-sm font-black text-emerald-950'}>
        {loading ? 'Enviando...' : done ? 'Enviado' : children ?? 'Enviar para pauta'}
      </button>
      {error ? <span className="col-span-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-bold text-red-800 ring-1 ring-red-100 sm:col-auto">{error}</span> : null}
    </div>
  );
}
