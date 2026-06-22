'use client';

import { useState } from 'react';

type Variant = 'inline' | 'header';

type CollectResponse = {
  ok?: boolean;
  error?: string;
  inserted?: number;
  updated?: number;
  skippedOld?: number;
  processedQueries?: number;
  queryLimit?: number;
  stoppedByDeadline?: boolean;
};

export function ManualCollectButton({ variant = 'inline' }: { variant?: Variant }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCollect() {
    setLoading(true);
    setMessage(null);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55_000);

    try {
      const res = await fetch('/api/panel/collect-news?mode=quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      const text = await res.text();
      let data: CollectResponse = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text || 'Resposta inválida do servidor.' };
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Falha ao coletar notícias. Status ${res.status}.`);
      }

      const partial = data.stoppedByDeadline ? ' Coleta parcial para evitar timeout.' : '';
      setMessage(
        `Coleta rápida concluída: ${data.inserted ?? 0} novas, ${data.updated ?? 0} atualizadas, ${data.skippedOld ?? 0} antigas ignoradas. ${data.processedQueries ?? 0}/${data.queryLimit ?? 0} buscas processadas.${partial}`,
      );
      setTimeout(() => window.location.reload(), 1600);
    } catch (err) {
      const message = err instanceof Error && err.name === 'AbortError'
        ? 'A coleta demorou demais e foi interrompida. Tente novamente em alguns minutos ou reduza as fontes ativas.'
        : err instanceof Error
          ? err.message
          : 'Erro desconhecido.';
      setError(message);
    } finally {
      clearTimeout(timeout);
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
          <div className="fixed left-4 right-4 top-[86px] z-50 rounded-xl border border-emerald-200 bg-white p-3 text-xs font-semibold text-emerald-800 shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="fixed left-4 right-4 top-[86px] z-50 rounded-xl border border-red-200 bg-white p-3 text-xs font-semibold text-red-800 shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96">
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
      {message ? <p className="text-left text-xs font-semibold text-emerald-700 sm:max-w-md sm:text-right">{message}</p> : null}
      {error ? <p className="text-left text-xs font-semibold text-red-700 sm:max-w-md sm:text-right">{error}</p> : null}
    </div>
  );
}
