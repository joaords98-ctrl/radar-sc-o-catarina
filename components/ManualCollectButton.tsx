'use client';

import { useState } from 'react';

type Variant = 'inline' | 'header';
type CollectMode = 'quick' | 'full';

type CollectResponse = {
  ok?: boolean;
  mode?: string;
  error?: string;
  inserted?: number;
  updated?: number;
  skippedOld?: number;
  processedQueries?: number;
  queryLimit?: number;
  stoppedByDeadline?: boolean;
};

const MODE_LABEL: Record<CollectMode, string> = {
  quick: 'rápida',
  full: 'pesada',
};

export function ManualCollectButton({ variant = 'inline' }: { variant?: Variant }) {
  const [loadingMode, setLoadingMode] = useState<CollectMode | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runCollect(mode: CollectMode) {
    setLoadingMode(mode);
    setMessage(null);
    setError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), mode === 'full' ? 70_000 : 55_000);

    try {
      const res = await fetch(`/api/panel/collect-news?mode=${mode}`, {
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
      const label = MODE_LABEL[mode];
      setMessage(
        `Coleta ${label} concluída: ${data.inserted ?? 0} novas, ${data.updated ?? 0} atualizadas, ${data.skippedOld ?? 0} antigas ignoradas. ${data.processedQueries ?? 0}/${data.queryLimit ?? 0} buscas processadas.${partial}`,
      );
      setTimeout(() => window.location.reload(), 1800);
    } catch (err) {
      const label = MODE_LABEL[mode];
      const message = err instanceof Error && err.name === 'AbortError'
        ? `A coleta ${label} demorou demais e foi interrompida. Ela pode ter salvado resultados parciais. Atualize a página em alguns segundos ou tente de novo mais tarde.`
        : err instanceof Error
          ? err.message
          : 'Erro desconhecido.';
      setError(message);
    } finally {
      clearTimeout(timeout);
      setLoadingMode(null);
    }
  }

  if (variant === 'header') {
    const disabled = loadingMode !== null;
    return (
      <div className="relative">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => runCollect('quick')}
            disabled={disabled}
            className="whitespace-nowrap rounded-full bg-emerald-500 px-3 py-2 text-xs font-black text-emerald-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-sm"
            title="Coleta rápida para atualizar o painel sem travar"
          >
            {loadingMode === 'quick' ? 'Coletando...' : 'Atualizar'}
          </button>
          <button
            type="button"
            onClick={() => runCollect('full')}
            disabled={disabled}
            className="whitespace-nowrap rounded-full bg-zinc-900 px-3 py-2 text-xs font-black text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-sm"
            title="Coleta pesada: busca mais fontes. Pode levar mais tempo."
          >
            {loadingMode === 'full' ? 'Pesada...' : 'Pesada'}
          </button>
        </div>
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

  const disabled = loadingMode !== null;

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <button
          type="button"
          onClick={() => runCollect('quick')}
          disabled={disabled}
          className="w-full rounded-xl bg-emerald-500 px-5 py-3 text-sm font-black text-emerald-950 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loadingMode === 'quick' ? 'Coletando...' : 'Coleta rápida'}
        </button>
        <button
          type="button"
          onClick={() => runCollect('full')}
          disabled={disabled}
          className="w-full rounded-xl bg-zinc-900 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loadingMode === 'full' ? 'Coletando pesado...' : 'Coleta pesada'}
        </button>
      </div>
      <p className="text-left text-[11px] font-semibold text-zinc-500 sm:max-w-md sm:text-right">
        Rápida: uso normal. Pesada: busca mais fontes e pode voltar parcial para evitar timeout.
      </p>
      {message ? <p className="text-left text-xs font-semibold text-emerald-700 sm:max-w-md sm:text-right">{message}</p> : null}
      {error ? <p className="text-left text-xs font-semibold text-red-700 sm:max-w-md sm:text-right">{error}</p> : null}
    </div>
  );
}
