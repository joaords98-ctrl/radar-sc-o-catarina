// Redige um RASCUNHO original a partir dos fatos apurados, usando o Gemini.
// Versão COM DIAGNÓSTICO: registra no log o motivo de pular a IA.
// O material da fonte é tratado como apuração, não como texto a parafrasear.
// O resultado é SEMPRE revisado pela redação antes de publicar.

import type { ArticleFacts } from './articleReader';

export type AiDraft = {
  title: string;
  supportLine: string;
  body: string;
  reviewerNotes: string[];
  usedAI: boolean;
};

type WriteInput = {
  pautaTitle: string;
  category: string;
  place: string;
  sourceName: string;
  sourceUrl: string;
  angle?: string | null;
  facts: ArticleFacts;
  sensitive: boolean;
};

const DEFAULT_MODEL = 'gemini-2.5-flash';

function log(msg: string) {
  console.log(`[redacao-ia] ${msg}`);
}

function buildSystemInstruction(sensitive: boolean) {
  return [
    'Você é redator do portal de notícias "O Catarina", de Santa Catarina.',
    'Escreva uma matéria ORIGINAL em português do Brasil, a partir dos FATOS apurados que receber.',
    'Regras inegociáveis:',
    '- Não copie nem parafraseie frases do material-fonte. Escreva com texto próprio, do zero.',
    '- Use apenas fatos presentes na apuração. NUNCA invente nomes, números, datas, cargos ou citações.',
    '- Se um dado essencial não estiver na apuração, deixe explícito que falta confirmar, não preencha de memória.',
    '- Tom jornalístico, direto, sem opinião e sem adjetivação sensacionalista.',
    sensitive
      ? '- Tema sensível: trate como suspeita/denúncia/investigação. Não afirme culpa. Use "segundo", "de acordo com", "teria". Registre que os citados têm direito de resposta.'
      : '- Confirme dados básicos (local, data, órgão) com naturalidade no texto.',
    'Responda SOMENTE com JSON válido, sem markdown e sem cercas de código, no formato:',
    '{"title": string, "supportLine": string, "body": string, "reviewerNotes": string[]}',
    'body usa parágrafos separados por \\n\\n. reviewerNotes lista o que a redação precisa confirmar antes de publicar.',
  ].join('\n');
}

function buildUserPrompt(input: WriteInput) {
  const f = input.facts;
  const factsBlock = f.rawForAI || `${f.title}\n${f.description}`;
  return [
    `Pauta identificada: ${input.pautaTitle}`,
    `Categoria: ${input.category}`,
    `Local: ${input.place}`,
    `Fonte inicial: ${input.sourceName} (${input.sourceUrl})`,
    input.angle ? `Ângulo sugerido pela redação: ${input.angle}` : '',
    '',
    'FATOS APURADOS (material de apuração, não copiar literalmente):',
    factsBlock || '(o sistema não conseguiu extrair texto da fonte)',
  ]
    .filter(Boolean)
    .join('\n');
}

function safeJsonParse(text: string): Partial<AiDraft> | null {
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function writeDraftWithAI(input: WriteInput): Promise<AiDraft | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    log('PULOU: GEMINI_API_KEY não encontrada no ambiente.');
    return null;
  }
  log(`chave detectada (começa com "${apiKey.slice(0, 6)}...", tamanho ${apiKey.length}).`);

  if (!input.facts.fetched) {
    log(`PULOU: não conseguiu LER a fonte. URL final: ${input.facts.finalUrl}`);
    return null;
  }
  if (input.facts.rawForAI.length < 120) {
    log(`PULOU: fonte lida mas texto curto demais (${input.facts.rawForAI.length} caracteres). URL: ${input.facts.finalUrl}`);
    return null;
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  log(`chamando Gemini (modelo ${model}) com ${input.facts.rawForAI.length} caracteres de apuração...`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemInstruction(input.sensitive) }] },
        contents: [{ role: 'user', parts: [{ text: buildUserPrompt(input) }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1500,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      log(`PULOU: Gemini respondeu HTTP ${response.status}. Detalhe: ${errBody.slice(0, 300)}`);
      return null;
    }

    const data = await response.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p?.text ?? '')
        .join('\n') ?? '';

    if (!text) {
      log(`PULOU: Gemini respondeu OK mas sem texto. Resposta: ${JSON.stringify(data).slice(0, 300)}`);
      return null;
    }

    const parsed = safeJsonParse(text);
    if (!parsed?.title || !parsed?.body) {
      log(`PULOU: resposta do Gemini não veio no formato esperado. Texto: ${text.slice(0, 300)}`);
      return null;
    }

    log('SUCESSO: rascunho redigido pela IA.');
    return {
      title: String(parsed.title).trim(),
      supportLine: String(parsed.supportLine ?? '').trim(),
      body: String(parsed.body).trim(),
      reviewerNotes: Array.isArray(parsed.reviewerNotes)
        ? parsed.reviewerNotes.map((n) => String(n).trim()).filter(Boolean)
        : [],
      usedAI: true,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(`PULOU: erro de rede/timeout ao chamar Gemini: ${msg}`);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
