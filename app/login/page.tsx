import { redirect } from 'next/navigation';
import { isRadarEditorialLoginRequired, isRadarLoginRequired } from '@/lib/radarAccess';

export const dynamic = 'force-dynamic';

function messageFor(error?: string, logout?: string) {
  if (logout) return { tone: 'ok', text: 'Sessão encerrada.' };
  if (error === 'invalid') return { tone: 'error', text: 'Senha incorreta. Digite exatamente o valor configurado em RADAR_ADMIN_PASSWORD na Vercel.' };
  if (error === 'missing_config') {
    return {
      tone: 'error',
      text: 'Configure RADAR_ADMIN_PASSWORD e RADAR_ADMIN_TOKEN na Vercel para ativar a versão com login.',
    };
  }
  return null;
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = typeof params.next === 'string' ? params.next : '/';
  const error = typeof params.error === 'string' ? params.error : undefined;
  const logout = typeof params.logout === 'string' ? params.logout : undefined;
  const message = messageFor(error, logout);
  const loginRequired = isRadarLoginRequired();
  const editorialLoginRequired = isRadarEditorialLoginRequired();

  if (!loginRequired && !editorialLoginRequired) {
    redirect('/');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-zinc-500">O Catarina</p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-zinc-950">Radar SC</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Acesse a área de redação para gerar base editorial, exportar matéria pronta para o site e usar controles internos.
        </p>

        {!loginRequired && editorialLoginRequired ? (
          <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm font-semibold leading-6 text-emerald-950 ring-1 ring-emerald-100">
            O clipping, escândalos, início e produção ficam abertos. A área de redação e o botão <strong>Gerar base</strong> exigem login.
          </div>
        ) : null}

        {message ? (
          <div className={`mt-5 rounded-xl p-4 text-sm font-semibold leading-6 ring-1 ${message.tone === 'error' ? 'bg-red-50 text-red-900 ring-red-100' : 'bg-emerald-50 text-emerald-950 ring-emerald-100'}`}>
            {message.text}
          </div>
        ) : null}

        <form action="/api/auth/login" method="post" className="mt-6 space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block">
            <span className="text-sm font-black text-zinc-800">Senha do painel</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-base font-semibold outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-200"
              placeholder="Digite a senha"
              required
            />
          </label>
          <button className="w-full rounded-xl bg-zinc-950 px-5 py-3 text-sm font-black text-white transition hover:bg-zinc-800">
            Entrar no Radar
          </button>
        </form>
      </section>
    </main>
  );
}
