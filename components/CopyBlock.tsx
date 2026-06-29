'use client';

import { useMemo, useState } from 'react';

type DraftContent = {
  siteTitle: string;
  supportLine: string;
  body: string;
  instagram: string;
  video: string;
  checklist?: string;
  sourceUrl?: string;
  category?: string;
  city?: string;
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

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'materia-o-catarina';
}

function downloadText(filename: string, text: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function siteArticleText(draft: DraftContent) {
  return `${draft.siteTitle}\n\n${draft.supportLine}\n\n${draft.body}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderBoldMarkdown(value: string) {
  return escapeHtml(value).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

function siteArticleHtml(draft: DraftContent) {
  const paragraphs = draft.body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${renderBoldMarkdown(paragraph)}</p>`)
    .join('\n');

  return [
    `<h1>${escapeHtml(draft.siteTitle)}</h1>`,
    `<p><strong>${escapeHtml(draft.supportLine)}</strong></p>`,
    paragraphs,
    draft.sourceUrl ? `<p><strong>Fonte inicial:</strong> <a href="${escapeHtml(draft.sourceUrl)}">${escapeHtml(draft.sourceUrl)}</a></p>` : '',
  ].filter(Boolean).join('\n\n');
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
      className="w-full rounded-xl bg-zinc-950 px-4 py-2 text-xs font-black text-white transition hover:bg-zinc-800 sm:w-auto"
    >
      {copied ? 'Copiado!' : label}
    </button>
  );
}

function DownloadButton({ filename, text, label, type }: { filename: string; text: string; label: string; type?: string }) {
  return (
    <button
      type="button"
      onClick={() => downloadText(filename, text, type)}
      className="w-full rounded-xl bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-950 ring-1 ring-emerald-200 transition hover:bg-emerald-200 sm:w-auto"
    >
      {label}
    </button>
  );
}

function DraftSection({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">{label}</p>
        <CopyButton text={text} />
      </div>
      <pre className="mt-3 whitespace-pre-wrap break-words rounded-xl bg-zinc-50 p-3 text-sm leading-6 sm:p-4">{text}</pre>
    </div>
  );
}

export function DraftCopyPanel({ draft }: { draft: DraftContent }) {
  const slug = useMemo(() => slugify(draft.siteTitle), [draft.siteTitle]);
  const siteArticle = useMemo(() => siteArticleText(draft), [draft]);
  const siteHtml = useMemo(() => siteArticleHtml(draft), [draft]);
  const siteJson = useMemo(() => {
    return JSON.stringify({
      title: draft.siteTitle,
      supportLine: draft.supportLine,
      body: draft.body,
      category: draft.category ?? null,
      city: draft.city ?? null,
      sourceUrl: draft.sourceUrl ?? null,
      status: 'rascunho',
    }, null, 2);
  }, [draft]);

  const fullText = useMemo(() => {
    return [
      'MATÉRIA SITE',
      siteArticle,
      '',
      draft.checklist ? 'CHECKLIST DE APURAÇÃO' : null,
      draft.checklist || null,
      draft.checklist ? '' : null,
      'INSTAGRAM',
      draft.instagram,
      '',
      'ROTEIRO VÍDEO CURTO',
      draft.video,
    ].filter(Boolean).join('\n');
  }, [siteArticle, draft.checklist, draft.instagram, draft.video]);

  return (
    <section className="mt-6 space-y-5">
      <div className="rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-500">Exportar matéria pronta para o site</p>
            <p className="mt-1 text-sm text-zinc-600">
              Copie ou baixe a versão limpa para publicar. O checklist fica separado para a redação.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            <CopyButton text={siteArticle} label="Copiar matéria site" />
            <DownloadButton filename={`${slug}.txt`} text={siteArticle} label="Baixar TXT" />
            <DownloadButton filename={`${slug}.html`} text={siteHtml} label="Baixar HTML" type="text/html;charset=utf-8" />
            <DownloadButton filename={`${slug}.json`} text={siteJson} label="Baixar JSON" type="application/json;charset=utf-8" />
            <CopyButton text={fullText} label="Copiar tudo" />
          </div>
        </div>
      </div>

      <DraftSection label="Título site" text={draft.siteTitle} />
      <DraftSection label="Linha de apoio" text={draft.supportLine} />
      <DraftSection label="Corpo pronto para site" text={draft.body} />
      {draft.checklist ? <DraftSection label="Checklist interno de apuração" text={draft.checklist} /> : null}
      <DraftSection label="Instagram" text={draft.instagram} />
      <DraftSection label="Roteiro vídeo curto" text={draft.video} />
    </section>
  );
}
