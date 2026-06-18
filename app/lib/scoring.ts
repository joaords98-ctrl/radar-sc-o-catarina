const hotWords = [
  'operação', 'prisão', 'mandado', 'corrupção', 'licitação', 'contrato', 'sobrepreço',
  'prefeito', 'vereador', 'deputado', 'governo', 'tce', 'mpsc', 'polícia', 'defesa civil',
  'enchente', 'alagamento', 'obra', 'hospital', 'fila', 'escola', 'creche', 'denúncia',
  'acidente', 'rodovia', 'trânsito', 'caminhão', 'carro', 'tombou', 'interditada', 'br-101',
  'br-282', 'sc-155', 'porto', 'turismo', 'emprego', 'economia', 'indústria', 'comércio',
  'saúde', 'educação', 'câmara', 'prefeitura', 'vídeo', 'flagra', 'imagens',
];

const urgentWords = [
  'morte', 'preso', 'foragido', 'investigação', 'fraude', 'cassação', 'desvio',
  'interdita', 'interditada', 'tombou', 'grave', 'emergência', 'alerta', 'vídeo', 'flagra',
];

const localWords = ['sc', 'santa catarina', 'catarinense', 'oeste', 'sul', 'norte', 'vale do itajaí', 'litoral', 'serra'];

export function scoreNews(input: {
  title: string;
  summary?: string | null;
  queryWeight?: number;
  publishedAt?: string | null;
}) {
  const text = `${input.title} ${input.summary ?? ''}`.toLowerCase();
  let score = 18 + Math.min(26, (input.queryWeight ?? 1) * 7);

  for (const word of hotWords) {
    if (text.includes(word)) score += 3;
  }

  for (const word of urgentWords) {
    if (text.includes(word)) score += 5;
  }

  for (const word of localWords) {
    if (text.includes(word)) score += 2;
  }

  // Evita que segurança pública domine tudo sozinha: pontua, mas não explode apenas por repetir polícia/prisão.
  const securityHits = ['polícia', 'prisão', 'preso', 'crime', 'operação'].filter((word) => text.includes(word)).length;
  if (securityHits >= 3) score -= 5;

  if (input.publishedAt) {
    const ageHours = (Date.now() - new Date(input.publishedAt).getTime()) / 36e5;
    if (ageHours <= 3) score += 22;
    else if (ageHours <= 6) score += 17;
    else if (ageHours <= 12) score += 12;
    else if (ageHours <= 24) score += 8;
    else if (ageHours <= 36) score += 3;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function inferAngle(title: string, topic?: string | null, city?: string | null) {
  const place = city ? ` em ${city}` : ' em Santa Catarina';
  const lower = title.toLowerCase();

  if (lower.includes('licitação') || lower.includes('contrato') || lower.includes('tce')) {
    return `Apurar valores, contrato, responsáveis e impacto ao contribuinte${place}.`;
  }
  if (lower.includes('acidente') || lower.includes('rodovia') || lower.includes('trânsito') || lower.includes('caminhão') || lower.includes('tombou')) {
    return `Checar local exato, estado das vítimas, liberação da rodovia e usar vídeo/imagens com crédito correto${place}.`;
  }
  if (lower.includes('polícia') || lower.includes('prisão') || lower.includes('operação')) {
    return `Checar fonte oficial e transformar em matéria objetiva de segurança pública${place}.`;
  }
  if (lower.includes('enchente') || lower.includes('chuva') || lower.includes('defesa civil')) {
    return `Atualizar alertas, áreas afetadas e cobrar prevenção/estrutura pública${place}.`;
  }
  if (lower.includes('hospital') || lower.includes('saúde') || lower.includes('fila')) {
    return `Apurar impacto direto ao morador, serviço afetado e posicionamento do órgão responsável${place}.`;
  }
  if (topic) return `Transformar em pauta de ${topic}, com dado local e fonte oficial${place}.`;
  return `Reapurar, checar fonte primária e escrever com ângulo próprio do O Catarina${place}.`;
}
