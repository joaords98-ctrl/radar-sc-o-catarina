'use client';

import { useState } from 'react';

export function ProductionTaskButton({ taskId, newsId, taskStatus, newsStatus, children, className }: {
  taskId: string;
  newsId?: string | null;
  taskStatus: 'pendente' | 'fazendo' | 'feito' | 'cancelado';
  newsStatus?: 'novo' | 'reapurar' | 'em_producao' | 'publicado' | 'descartado';
  children: React.ReactNode;
  className: string;
}) {
  const [loading, setLoading] = useState(false);

  async function updateTask() {
    setLoading(true);
    try {
      const res = await fetch('/api/production/update-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, newsId, taskStatus, newsStatus }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar pauta');
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={updateTask} disabled={loading} className={className}>
      {loading ? 'Atualizando...' : children}
    </button>
  );
}
