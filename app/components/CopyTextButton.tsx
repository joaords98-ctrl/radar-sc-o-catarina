'use client';

import { useState } from 'react';

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

export function CopyTextButton({ text, label = 'Copiar', className }: { text: string; label?: string; className?: string }) {
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
      className={className ?? 'rounded-xl bg-zinc-950 px-4 py-2 text-sm font-black text-white transition hover:bg-zinc-800'}
    >
      {copied ? 'Copiado!' : label}
    </button>
  );
}
