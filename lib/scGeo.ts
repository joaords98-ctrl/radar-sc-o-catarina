export type ScGeoMatch = {
  allowed: boolean;
  city: string | null;
  region: string | null;
  reason: string;
};

const SC_CITIES: Array<{ name: string; region: string; aliases?: string[] }> = [
  { name: 'Joinville', region: 'Norte' },
  { name: 'Florianópolis', region: 'Grande Florianópolis', aliases: ['Florianopolis', 'Floripa'] },
  { name: 'Blumenau', region: 'Vale do Itajaí' },
  { name: 'Itajaí', region: 'Litoral Norte', aliases: ['Itajai'] },
  { name: 'São José', region: 'Grande Florianópolis', aliases: ['Sao Jose'] },
  { name: 'Chapecó', region: 'Oeste', aliases: ['Chapeco'] },
  { name: 'Palhoça', region: 'Grande Florianópolis', aliases: ['Palhoca'] },
  { name: 'Criciúma', region: 'Sul', aliases: ['Criciuma'] },
  { name: 'Jaraguá do Sul', region: 'Norte/Vale do Itapocu', aliases: ['Jaragua do Sul'] },
  { name: 'Lages', region: 'Serra' },
  { name: 'Balneário Camboriú', region: 'Litoral Norte', aliases: ['Balneario Camboriu'] },
  { name: 'Brusque', region: 'Vale do Itajaí' },
  { name: 'Tubarão', region: 'Sul', aliases: ['Tubarao'] },
  { name: 'Camboriú', region: 'Litoral Norte', aliases: ['Camboriu'] },
  { name: 'São Bento do Sul', region: 'Norte', aliases: ['Sao Bento do Sul'] },
  { name: 'Caçador', region: 'Meio-Oeste', aliases: ['Cacador'] },
  { name: 'Concórdia', region: 'Oeste', aliases: ['Concordia'] },
  { name: 'Navegantes', region: 'Litoral Norte' },
  { name: 'Rio do Sul', region: 'Alto Vale' },
  { name: 'Araranguá', region: 'Sul', aliases: ['Ararangua'] },
  { name: 'Gaspar', region: 'Vale do Itajaí' },
  { name: 'Biguaçu', region: 'Grande Florianópolis', aliases: ['Biguacu'] },
  { name: 'Indaial', region: 'Vale do Itajaí' },
  { name: 'Mafra', region: 'Planalto Norte' },
  { name: 'Canoinhas', region: 'Planalto Norte' },
  { name: 'Joaçaba', region: 'Meio-Oeste', aliases: ['Joacaba'] },
  { name: 'Xanxerê', region: 'Oeste', aliases: ['Xanxere'] },
  { name: 'Videira', region: 'Meio-Oeste' },
  { name: 'Fraiburgo', region: 'Meio-Oeste' },
  { name: 'São Miguel do Oeste', region: 'Oeste', aliases: ['Sao Miguel do Oeste'] },
  { name: 'Porto União', region: 'Planalto Norte', aliases: ['Porto Uniao'] },
  { name: 'Içara', region: 'Sul', aliases: ['Icara'] },
  { name: 'Laguna', region: 'Sul' },
  { name: 'Imbituba', region: 'Sul' },
  { name: 'Penha', region: 'Litoral Norte' },
  { name: 'Porto Belo', region: 'Litoral Norte' },
  { name: 'Itapema', region: 'Litoral Norte' },
  { name: 'Tijucas', region: 'Grande Florianópolis' },
  { name: 'Xaxim', region: 'Oeste' },
  { name: 'Seara', region: 'Oeste' },
  { name: 'Maravilha', region: 'Oeste' },
  { name: 'Pinhalzinho', region: 'Oeste' },
  { name: 'Abelardo Luz', region: 'Oeste' },
  { name: 'São Lourenço do Oeste', region: 'Oeste', aliases: ['Sao Lourenco do Oeste'] },
  { name: 'Dionísio Cerqueira', region: 'Oeste', aliases: ['Dionisio Cerqueira'] },
  { name: 'Curitibanos', region: 'Serra/Meio-Oeste' },
  { name: 'Campos Novos', region: 'Meio-Oeste' },
  { name: 'Herval d’Oeste', region: 'Meio-Oeste', aliases: ['Herval d Oeste', 'Herval do Oeste'] },
  { name: 'Capinzal', region: 'Meio-Oeste' },
  { name: 'Treze Tílias', region: 'Meio-Oeste', aliases: ['Treze Tilias'] },
  { name: 'Guaramirim', region: 'Norte/Vale do Itapocu' },
  { name: 'Schroeder', region: 'Norte/Vale do Itapocu' },
  { name: 'Araquari', region: 'Norte' },
  { name: 'Garuva', region: 'Norte' },
  { name: 'São Francisco do Sul', region: 'Norte', aliases: ['Sao Francisco do Sul'] },
  { name: 'Porto União', region: 'Planalto Norte', aliases: ['Porto Uniao'] },
  { name: 'Três Barras', region: 'Planalto Norte', aliases: ['Tres Barras'] },
  { name: 'Balneário Piçarras', region: 'Litoral Norte', aliases: ['Balneario Picarras'] },
  { name: 'Bombinhas', region: 'Litoral Norte' },
  { name: 'Ilhota', region: 'Vale do Itajaí' },
  { name: 'Pomerode', region: 'Vale do Itajaí' },
  { name: 'Timbó', region: 'Vale do Itajaí', aliases: ['Timbo'] },
  { name: 'Ituporanga', region: 'Alto Vale' },
  { name: 'Taió', region: 'Alto Vale', aliases: ['Taio'] },
  { name: 'Braço do Norte', region: 'Sul', aliases: ['Braco do Norte'] },
  { name: 'Orleans', region: 'Sul' },
  { name: 'Urussanga', region: 'Sul' },
  { name: 'Sombrio', region: 'Sul' },
  { name: 'Balneário Rincão', region: 'Sul', aliases: ['Balneario Rincao'] },
  { name: 'Garopaba', region: 'Sul' },
  { name: 'São Joaquim', region: 'Serra', aliases: ['Sao Joaquim'] },
  { name: 'Urubici', region: 'Serra' },
  { name: 'Otacílio Costa', region: 'Serra', aliases: ['Otacilio Costa'] },
  { name: 'Correia Pinto', region: 'Serra' },
];

const SC_SOURCE_MARKERS = [
  'nsctotal', 'nsc total', 'ndmais', 'scc10', 'clicrdc', 'jornal razao', 'jornal razão', 'omunicipio',
  'o municipio', 'misturebas', 'tn sul', 'sul in foco', 'visor noticias', 'visor notícias',
  'obvsc', 'folha de sc', 'portal via certa', 'portal litoral sul', 'portal meneghetti',
  'portal agora noticias', 'portal agora notícias', 'jornal metas', 'canal ideal', 'g1 sc',
  'g1 santa catarina', 'diarinho', 'imagem da ilha', 'santa catarina em pauta',
  'gazeta sbs', 'rcn online', 'correio sc', 'sc portais', 'tudo aqui sc',
  'blog do prisco', 'donna da noticia', 'donna da notícia', 'donnadanoticia',
  'oeste mais', 'oestemais', 'click xaxim', 'clickxaxim', 'nova fm 103',
  'di regional', 'diregional', 'agencia icem', 'agência icem', 'agenciaicem',
  'nsctotal.com.br', 'diarinho.net', 'imagemdailha.com.br',
  'scc10.com.br', 'santacatarinaempauta.com.br', 'rcnonline.com.br',
  'correiosc.com.br', 'gazetasbs.com.br', 'scportais.com.br',
  'tudoaquisc.com.br', 'blogdoprisco.com.br', 'donnadanoticia.com.br',
  'oestemais.com', 'clickxaxim.com.br', 'novafm103.com.br',
  'diregional.com.br', 'agenciaicem.com.br',
];

const SC_MARKERS = [
  'santa catarina', 'catarinense', 'catarinenses', 'govsc', 'alesc', 'tjsc', 'mpsc', 'tce-sc',
  'pm-sc', 'pmsc', 'pcsc', 'bombeiros de sc', 'defesa civil sc', 'oeste catarinense',
  'sul catarinense', 'norte catarinense', 'vale do itajai', 'vale do itajaí', 'grande florianopolis',
  'grande florianópolis', 'serra catarinense', 'litoral norte', 'litoral sul',
];

const OTHER_STATE_MARKERS = [
  'ceara', 'ceará', 'sul do ceara', 'sul do ceará', 'fortaleza', 'sobral', 'juazeiro do norte',
  'sao paulo', 'são paulo', 'rio de janeiro', 'minas gerais', 'parana', 'paraná', 'rio grande do sul',
  'bahia', 'pernambuco', 'goias', 'goiás', 'mato grosso', 'mato grosso do sul', 'paraiba', 'paraíba',
  'rio grande do norte', 'alagoas', 'sergipe', 'piaui', 'piauí', 'maranhao', 'maranhão', 'amazonas',
  'para ', 'pará', 'acre', 'rondonia', 'rondônia', 'roraima', 'amapa', 'amapá', 'tocantins',
  'espirito santo', 'espírito santo', 'distrito federal', 'brasilia', 'brasília',
];

const REGION_PATTERNS: Array<{ region: string; patterns: string[] }> = [
  { region: 'Oeste', patterns: ['oeste de santa catarina', 'oeste catarinense', 'no oeste', 'regiao oeste', 'região oeste', 'sc 155', 'sc-155'] },
  { region: 'Meio-Oeste', patterns: ['meio oeste', 'meio-oeste', 'meio oeste catarinense', 'meio-oeste catarinense'] },
  { region: 'Sul', patterns: ['sul de santa catarina', 'sul catarinense', 'regiao sul de sc', 'região sul de sc'] },
  { region: 'Norte', patterns: ['norte de santa catarina', 'norte catarinense', 'planalto norte'] },
  { region: 'Vale do Itajaí', patterns: ['vale do itajai', 'vale do itajaí', 'alto vale'] },
  { region: 'Litoral Norte', patterns: ['litoral norte', 'foz do itajai', 'foz do itajaí'] },
  { region: 'Grande Florianópolis', patterns: ['grande florianopolis', 'grande florianópolis'] },
  { region: 'Serra', patterns: ['serra catarinense', 'planalto serrano'] },
];

const SC_ROAD_REGEX = /\b(sc[-\s]?\d{2,3}|br[-\s]?(101|282|470|280|116|153|163|158|285))\b/i;
const OUT_OF_STATE_GOV_DOMAIN = /(^|\.)(ac|al|am|ap|ba|ce|df|es|go|ma|mg|ms|mt|pa|pb|pe|pi|pr|rj|rn|ro|rr|rs|se|sp|to)\.gov\.br$/i;

function normalize(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsPhrase(text: string, phrase: string) {
  const normalizedPhrase = normalize(phrase);
  return text.includes(normalizedPhrase);
}

function detectCity(rawText: string) {
  const text = normalize(rawText);
  for (const city of SC_CITIES) {
    const names = [city.name, ...(city.aliases ?? [])];
    if (names.some((name) => containsPhrase(text, name))) return city;
  }
  return null;
}

function detectRegion(rawText: string) {
  const text = normalize(rawText);
  for (const region of REGION_PATTERNS) {
    if (region.patterns.some((pattern) => containsPhrase(text, pattern))) return region.region;
  }
  return null;
}

function hasScMarker(rawText: string) {
  const text = normalize(rawText);
  return SC_MARKERS.some((marker) => containsPhrase(text, marker)) || SC_ROAD_REGEX.test(rawText);
}

function hasScSource(rawText: string) {
  const text = normalize(rawText);
  return SC_SOURCE_MARKERS.some((marker) => containsPhrase(text, marker));
}

function hasOtherStateMarker(rawText: string) {
  const text = normalize(rawText);
  return OTHER_STATE_MARKERS.some((marker) => containsPhrase(text, marker));
}

export function isOutOfStateGovDomain(domain?: string | null) {
  if (!domain) return false;
  return OUT_OF_STATE_GOV_DOMAIN.test(domain.toLowerCase().replace(/^www\./, ''));
}

export function classifySantaCatarinaNews(input: {
  title: string;
  summary?: string | null;
  sourceName?: string | null;
  sourceDomain?: string | null;
  queryCity?: string | null;
  queryRegion?: string | null;
}): ScGeoMatch {
  const fullText = `${input.title} ${input.summary ?? ''} ${input.sourceName ?? ''} ${input.sourceDomain ?? ''}`;
  const cityMatch = detectCity(fullText);
  const regionMatch = detectRegion(fullText);
  const sourceLooksSc = hasScSource(fullText);
  const scMarker = hasScMarker(fullText);
  const otherState = hasOtherStateMarker(fullText) || isOutOfStateGovDomain(input.sourceDomain);
  const queryCityAppears = input.queryCity ? containsPhrase(fullText, input.queryCity) : false;

  if (otherState && !cityMatch && !regionMatch && !scMarker && !sourceLooksSc) {
    return { allowed: false, city: null, region: null, reason: 'fora_de_sc' };
  }

  if (cityMatch) return { allowed: true, city: cityMatch.name, region: cityMatch.region, reason: 'cidade_sc' };
  if (regionMatch) return { allowed: true, city: null, region: regionMatch, reason: 'regiao_sc' };
  if (scMarker) return { allowed: true, city: null, region: input.queryRegion ?? 'SC', reason: 'marcador_sc' };
  if (sourceLooksSc) return { allowed: true, city: input.queryCity ?? null, region: input.queryRegion ?? 'SC', reason: 'fonte_sc' };
  if (queryCityAppears) return { allowed: true, city: input.queryCity ?? null, region: input.queryRegion ?? null, reason: 'cidade_da_busca' };

  return { allowed: false, city: null, region: null, reason: 'sem_contexto_sc' };
}

export function inferScCityAndRegion(input: {
  title: string;
  summary?: string | null;
  sourceName?: string | null;
  sourceDomain?: string | null;
  queryCity?: string | null;
  queryRegion?: string | null;
}) {
  return classifySantaCatarinaNews(input);
}

export const CITY_FILTERS = ['Joinville', 'Florianópolis', 'Blumenau', 'Itajaí', 'Chapecó', 'Criciúma', 'Lages', 'Balneário Camboriú', 'Brusque', 'São José', 'Palhoça', 'Jaraguá do Sul', 'Xanxerê', 'Concórdia', 'São Miguel do Oeste', 'Rio do Sul'];
