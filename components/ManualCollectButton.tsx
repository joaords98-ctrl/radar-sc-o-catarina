'use client';

import { useState } from 'react';

export function ManualCollectButton() {
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

      setMessage(`Coleta do dia concluída: ${data.inserted ?? 0} novas, ${data.updated ?? 0} atualizadas, ${data.skippedOld ?? 0} antigas ignoradas, janela ${data.recentHours ?? 24}h.`);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
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
