'use client';

import { useState } from 'react';

type Variant = 'inline' | 'header';

export function ManualCollectButton({ variant = 'inline' }: { variant?: Variant }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCollect() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/panel/collect-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Falha ao coletar notícias.');
      }

      setMessage(`Coleta concluída: ${data.inserted ?? 0} novas, ${data.updated ?? 0} atualizadas, ${data.skippedOld ?? 0} antigas ignoradas.`);
      setTimeout(() => window.location.reload(), 1400);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }

  if (variant === 'header') {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={runCollect}
          disabled={loading}
          className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-black text-emerald-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          title="Coletar notícias recentes agora"
        >
          {loading ? 'Coletando...' : 'Atualizar agora'}
        </button>
        {message ? (
          <div className="absolute right-0 top-12 z-50 w-72 rounded-xl border border-emerald-200 bg-white p-3 text-xs font-semibold text-emerald-800 shadow-lg">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="absolute right-0 top-12 z-50 w-72 rounded-xl border border-red-200 bg-white p-3 text-xs font-semibold text-red-800 shadow-lg">
            {error}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={runCollect}
        disabled={loading}
        className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Coletando...' : 'Atualizar agora manualmente'}
      </button>
      {message ? <p className="max-w-xs text-right text-xs font-semibold text-emerald-700">{message}</p> : null}
      {error ? <p className="max-w-xs text-right text-xs font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
