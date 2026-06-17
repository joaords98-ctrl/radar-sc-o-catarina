const hotWords = [
  'operação', 'prisão', 'mandado', 'corrupção', 'licitação', 'contrato', 'sobrepreço',
  'prefeito', 'vereador', 'deputado', 'governo', 'tce', 'mpsc', 'polícia', 'defesa civil',
  'enchente', 'alagamento', 'obra', 'hospital', 'fila', 'escola', 'creche', 'denúncia',
];

const urgentWords = ['morte', 'preso', 'foragido', 'investigação', 'fraude', 'cassação', 'desvio'];

export function scoreNews(input: {
  title: string;
  summary?: string | null;
  queryWeight?: number;
  publishedAt?: string | null;
}) {
  const text = `${input.title} ${input.summary ?? ''}`.toLowerCase();
  let score = 20 + Math.min(30, (input.queryWeight ?? 1) * 8);

  for (const word of hotWords) {
    if (text.includes(word)) score += 4;
  }

  for (const word of urgentWords) {
    if (text.includes(word)) score += 5;
  }

  if (input.publishedAt) {
    const ageHours = (Date.now() - new Date(input.publishedAt).getTime()) / 36e5;
    if (ageHours <= 6) score += 18;
    else if (ageHours <= 24) score += 10;
    else if (ageHours <= 72) score += 4;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function inferAngle(title: string, topic?: string | null, city?: string | null) {
  const place = city ? ` em ${city}` : ' em Santa Catarina';
  const lower = title.toLowerCase();

  if (lower.includes('licitação') || lower.includes('contrato') || lower.includes('tce')) {
    return `Apurar valores, contrato, responsáveis e impacto ao contribuinte${place}.`;
  }
  if (lower.includes('polícia') || lower.includes('prisão') || lower.includes('operação')) {
    return `Checar fonte oficial e transformar em matéria objetiva de segurança pública${place}.`;
  }
  if (lower.includes('enchente') || lower.includes('chuva') || lower.includes('defesa civil')) {
    return `Atualizar alertas, áreas afetadas e cobrar prevenção/estrutura pública${place}.`;
  }
  if (topic) return `Transformar em pauta de ${topic}, com dado local e fonte oficial${place}.`;
  return `Reapurar, checar fonte primária e escrever com ângulo próprio do O Catarina${place}.`;
}
