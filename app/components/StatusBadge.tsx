const labels: Record<string, string> = {
  novo: 'Novo',
  reapurar: 'Reapurar',
  em_producao: 'Em produção',
  publicado: 'Publicado',
  descartado: 'Descartado',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-700 ring-1 ring-zinc-200">
      {labels[status] ?? status}
    </span>
  );
}
