export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-semibold text-zinc-500 sm:text-sm">{label}</p>
      <p className="mt-2 break-words text-2xl font-black text-zinc-950 sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 line-clamp-2 text-[11px] text-zinc-500 sm:text-xs">{hint}</p> : null}
    </div>
  );
}
