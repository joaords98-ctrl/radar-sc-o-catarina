'use client';

import { useMemo, useState } from 'react';

type DraftContent = {
  siteTitle: string;
  supportLine: string;
  body: string;
  instagram: string;
  video: string;
};

function copyFallback(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        copyFallback(text);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      copyFallback(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-xl bg-zinc-950 px-4 py-2 text-xs font-black text-white transition hover:bg-zinc-800"
    >
      {copied ? 'Copiado!' : label}
    </button>
  );
}

function DraftSection({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{label}</p>
        <CopyButton text={text} />
      </div>
      <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-zinc-50 p-4 text-sm leading-6">{text}</pre>
    </div>
  );
}

export function DraftCopyPanel({ draft }: { draft: DraftContent }) {
  const siteArticle = useMemo(() => {
    return `${draft.siteTitle}\n\n${draft.supportLine}\n\n${draft.body}`;
  }, [draft]);

  const fullText = useMemo(() => {
    return [
      'MATÉRIA SITE',
      siteArticle,
      '',
      'INSTAGRAM',
      draft.instagram,
      '',
      'ROTEIRO VÍDEO CURTO',
      draft.video,
    ].join('\n');
  }, [siteArticle, draft.instagram, draft.video]);

  return (
    <section className="mt-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Copiar conteúdo</p>
          <p className="mt-1 text-sm text-zinc-600">Use os botões para copiar a matéria, legenda ou roteiro depois de gerar a base.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={siteArticle} label="Copiar matéria site" />
          <CopyButton text={fullText} label="Copiar tudo" />
        </div>
      </div>

      <DraftSection label="Título site" text={draft.siteTitle} />
      <DraftSection label="Linha de apoio" text={draft.supportLine} />
      <DraftSection label="Corpo base" text={draft.body} />
      <DraftSection label="Instagram" text={draft.instagram} />
      <DraftSection label="Roteiro vídeo curto" text={draft.video} />
    </section>
  );
}
