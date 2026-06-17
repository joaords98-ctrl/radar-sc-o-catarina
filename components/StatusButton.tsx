'use client';

import { useState } from 'react';

export function StatusButton({ id, status, children, className }: { id: string; status: string; children: React.ReactNode; className: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function updateStatus() {
    setLoading(true);
    setDone(false);
    try {
      const res = await fetch('/api/news/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar');
      setDone(true);
      setTimeout(() => window.location.reload(), 450);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={updateStatus} disabled={loading} className={className}>
      {loading ? 'Atualizando...' : done ? 'Ok' : children}
    </button>
  );
}
