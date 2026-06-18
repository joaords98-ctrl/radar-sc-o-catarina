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
          className="whitespace-nowrap rounded-full bg-emerald-500 px-3 py-2 text-xs font-black text-emerald-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-sm"
          title="Coletar notícias recentes agora"
        >
          {loading ? 'Coletando...' : 'Atualizar'}
        </button>
        {message ? (
          <div className="fixed left-4 right-4 top-[86px] z-50 rounded-xl border border-emerald-200 bg-white p-3 text-xs font-semibold text-emerald-800 shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-80">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="fixed left-4 right-4 top-[86px] z-50 rounded-xl border border-red-200 bg-white p-3 text-xs font-semibold text-red-800 shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-80">
            {error}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
      <button
        type="button"
        onClick={runCollect}
        disabled={loading}
        className="w-full rounded-xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? 'Coletando...' : 'Atualizar agora manualmente'}
      </button>
      {message ? <p className="text-left text-xs font-semibold text-emerald-700 sm:max-w-xs sm:text-right">{message}</p> : null}
      {error ? <p className="text-left text-xs font-semibold text-red-700 sm:max-w-xs sm:text-right">{error}</p> : null}
    </div>
  );
}
