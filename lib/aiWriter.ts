// Redige um RASCUNHO original a partir dos fatos apurados, usando o Gemini.
// Importante: o material da fonte é tratado como apuração, não como texto a
// ser parafraseado. A IA escreve matéria nova, com ângulo do O Catarina, e o
// resultado é SEMPRE revisado pela redação antes de publicar.

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

// Modelo do nível gratuito do Gemini. Flash é o disponível no free tier e tem
// qualidade boa para redigir notícia. Pode ser trocado pela env GEMINI_MODEL.
const DEFAULT_MODEL = 'gemini-2.5-flash';

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

/** Chama a API do Gemini. Retorna null se não houver chave ou em caso de erro. */
export async function writeDraftWithAI(input: WriteInput): Promise<AiDraft | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  // Sem fatos suficientes não vale gastar chamada: a redação decide na mão.
  if (!input.facts.fetched || input.facts.rawForAI.length < 120) return null;

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildSystemInstruction(input.sensitive) }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: buildUserPrompt(input) }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1500,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p?.text ?? '')
        .join('\n') ?? '';

    const parsed = safeJsonParse(text);
    if (!parsed?.title || !parsed?.body) return null;

    return {
      title: String(parsed.title).trim(),
      supportLine: String(parsed.supportLine ?? '').trim(),
      body: String(parsed.body).trim(),
      reviewerNotes: Array.isArray(parsed.reviewerNotes)
        ? parsed.reviewerNotes.map((n) => String(n).trim()).filter(Boolean)
        : [],
      usedAI: true,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
