'use client';

import { useMemo, useState } from 'react';

type ActiveSearchItem = {
  id?: string;
  title: string;
  link: string;
  sourceName: string | null;
  sourceDomain: string | null;
  publishedAt: string;
  city: string | null;
  region: string | null;
  topic: string | null;
  score: number;
  summary: string | null;
};

type Result = {
  ok: boolean;
  error?: string;
  finalQuery?: string;
  inserted?: number;
  updated?: number;
  skipped?: number;
  skippedOld?: number;
  skippedOutOfState?: number;
  skippedNoScContext?: number;
  hours?: number;
  items?: ActiveSearchItem[];
};

const cities = ['', 'Joinville', 'Florianópolis', 'Blumenau', 'Itajaí', 'Chapecó', 'Criciúma', 'Lages', 'Balneário Camboriú', 'Brusque', 'São José', 'Palhoça', 'Jaraguá do Sul'];
const regions = ['', 'Oeste', 'Meio-Oeste', 'Sul', 'Norte', 'Vale do Itajaí', 'Litoral Norte', 'Grande Florianópolis', 'Serra'];
const topics = ['', 'Geral', 'Trânsito/Rodovias', 'Política', 'Serviços Públicos', 'Defesa Civil', 'Economia', 'Causa Animal', 'Segurança Pública'];

const quickSearches = [
  'vídeo caminhão tombou rodovia SC-155',
  'acidente BR-101 vídeo carro caminhão Santa Catarina',
  'prefeitura investigação contrato Santa Catarina',
  'Defesa Civil chuva alerta Santa Catarina',
  'hospital fila atendimento Santa Catarina',
  'câmara vereadores projeto polêmico Santa Catarina',
];

export function ActiveSearchClient() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [topic, setTopic] = useState('');
  const [hours, setHours] = useState('24');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const canSearch = useMemo(() => Boolean(q.trim() || city || region || topic), [q, city, region, topic]);

  async function copyText(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied('Falha ao copiar');
    }
  }

  async function runSearch() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/panel/active-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, city, region, topic, hours: Number(hours), limit: 35 }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ ok: false, error: err instanceof Error ? err.message : 'Erro desconhecido' });
    } finally {
      setLoading(false);
    }
  }

  const resultText = result?.items?.length
    ? result.items.map((item, index) => `${index + 1}. ${item.title}\nFonte: ${item.sourceName ?? item.sourceDomain ?? 'Não identificada'}\nCidade/região: ${item.city ?? item.region ?? 'SC'}\nLink: ${item.link}`).join('\n\n')
    : '';

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Termo de busca</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ex.: vídeo caminhão tombou SC-155"
              className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold outline-none ring-0 focus:border-zinc-900"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Cidade</span>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold outline-none focus:border-zinc-900">
              {cities.map((item) => <option key={item} value={item}>{item || 'Todas'}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Região</span>
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold outline-none focus:border-zinc-900">
              {regions.map((item) => <option key={item} value={item}>{item || 'Todas'}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_180px_180px]">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Tema</span>
            <select value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold outline-none focus:border-zinc-900">
              {topics.map((item) => <option key={item} value={item}>{item || 'Todos'}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Janela</span>
            <select value={hours} onChange={(e) => setHours(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold outline-none focus:border-zinc-900">
              <option value="6">Últimas 6h</option>
              <option value="12">Últimas 12h</option>
              <option value="24">Últimas 24h</option>
              <option value="36">Últimas 36h</option>
              <option value="72">Últimas 72h</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={runSearch}
              disabled={!canSearch || loading}
              className="w-full rounded-xl bg-zinc-950 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Buscando...' : 'Buscar agora'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {quickSearches.map((item) => (
            <button key={item} type="button" onClick={() => setQ(item)} className="whitespace-nowrap rounded-full bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200">
              {item}
            </button>
          ))}
        </div>
      </section>

      {result ? (
        <section className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
          {!result.ok ? (
            <div className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800 ring-1 ring-red-100">{result.error || 'Falha na busca.'}</div>
          ) : (
            <>
              <div className="flex flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Resultado da busca ativa</p>
                  <h3 className="mt-1 text-xl font-black sm:text-2xl">{result.items?.length ?? 0} notícias salvas no Radar</h3>
                  <p className="mt-2 text-sm text-zinc-600">
                    {result.inserted ?? 0} novas · {result.updated ?? 0} atualizadas · {result.skippedOld ?? 0} antigas ignoradas · {result.skippedOutOfState ?? 0} fora de SC bloqueadas.
                  </p>
                  {result.finalQuery ? <p className="mt-2 text-xs text-zinc-500">Consulta usada: {result.finalQuery}</p> : null}
                </div>
                <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                  {result.finalQuery ? <button onClick={() => copyText('consulta', result.finalQuery || '')} className="w-full rounded-xl bg-zinc-100 px-4 py-2 text-center text-sm font-bold text-zinc-800 sm:w-auto">Copiar consulta</button> : null}
                  {resultText ? <button onClick={() => copyText('resultados', resultText)} className="w-full rounded-xl bg-emerald-100 px-4 py-2 text-center text-sm font-bold text-emerald-900 sm:w-auto">Copiar resultados</button> : null}
                  <a href="/stories" className="w-full rounded-xl bg-zinc-950 px-4 py-2 text-center text-sm font-bold text-white sm:w-auto">Ver pautas</a>
                </div>
              </div>
              {copied ? <p className="mt-3 text-sm font-bold text-emerald-700">Copiado: {copied}</p> : null}

              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {result.items?.map((item) => (
                  <article key={item.link} className="rounded-xl border bg-zinc-50 p-3 sm:p-4">
                    <div className="flex flex-wrap gap-2 text-xs font-black">
                      <span className="rounded-full bg-zinc-950 px-2 py-1 text-white">Score {item.score}</span>
                      <span className="rounded-full bg-zinc-200 px-2 py-1 text-zinc-800">{item.city ?? item.region ?? 'SC'}</span>
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-900">{item.topic ?? 'Busca ativa'}</span>
                    </div>
                    <h4 className="mt-3 font-black leading-tight">{item.title}</h4>
                    <p className="mt-2 text-xs font-semibold text-zinc-500">{item.sourceName ?? item.sourceDomain ?? 'Fonte não identificada'} · {new Date(item.publishedAt).toLocaleString('pt-BR')}</p>
                    {item.summary ? <p className="mt-2 text-sm text-zinc-600 line-clamp-3">{item.summary}</p> : null}
                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                      <a href={item.link} target="_blank" rel="noreferrer" className="rounded-xl bg-zinc-900 px-3 py-2 text-center text-xs font-bold text-white">Abrir fonte</a>
                      {item.id ? <a href={`/draft?newsId=${item.id}`} className="rounded-xl bg-emerald-100 px-3 py-2 text-center text-xs font-bold text-emerald-900">Gerar base</a> : null}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
