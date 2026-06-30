'use client';

import { useState } from 'react';

type Props = {
  title: string;
  supportLine: string;
  content: string;
  category?: string;
  city?: string;
  sourceUrl?: string;
};

export function SendDraftToPortalButton({ title, supportLine, content, category, city, sourceUrl }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendDraft() {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/portal/send-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, supportLine, content, category, city, sourceUrl }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || 'Falha ao enviar rascunho para o portal.');
      }

      const editUrl = typeof data.editUrl === 'string' ? data.editUrl : null;
      const id = data.id ? ` #${data.id}` : '';
      setMessage(editUrl ? `Rascunho criado${id}. Abrir no portal: ${editUrl}` : `Rascunho criado no portal${id}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={sendDraft}
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? 'Enviando...' : 'Enviar para o site como rascunho'}
      </button>
      {message ? <p className="max-w-xl text-xs font-semibold text-blue-800">{message}</p> : null}
      {error ? <p className="max-w-xl text-xs font-semibold text-red-700">{error}</p> : null}
    </div>
  );
}
