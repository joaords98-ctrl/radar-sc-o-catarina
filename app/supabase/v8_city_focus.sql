-- Radar SC v8 — filtro Santa Catarina + busca por cidade/região + pauta equilibrada
-- Rode no Supabase SQL Editor depois da v7.

-- 1) Desativa as buscas antigas que misturavam política + segurança em todos os municípios.
-- Elas puxavam segurança demais e, às vezes, notícia de outros estados.
update rss_queries
set enabled = false
where label in (
  'SC Segurança pública',
  'Joinville Radar',
  'Florianópolis Radar',
  'Blumenau Radar',
  'Itajaí Radar',
  'São José Radar',
  'Chapecó Radar',
  'Palhoça Radar',
  'Criciúma Radar',
  'Jaraguá do Sul Radar',
  'Lages Radar',
  'Balneário Camboriú Radar',
  'Brusque Radar'
)
or query ilike '%política segurança prefeitura operação obra denúncia%';

-- 2) Evita duplicar se você rodar este SQL mais de uma vez.
delete from rss_queries where label like 'V8 %';

-- 3) Buscas estaduais equilibradas.
insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('V8 SC Geral do dia','"Santa Catarina" OR catarinense OR SC notícia hoje últimas horas', 'Geral', null, 'SC', 5, true),
('V8 SC Trânsito e rodovias','"Santa Catarina" acidente rodovia trânsito caminhão carro tombou vídeo BR-101 BR-282 BR-470 SC-155', 'Trânsito/Rodovias', null, 'SC', 5, true),
('V8 SC Política municípios','"Santa Catarina" prefeitura prefeito vereador câmara municipal governo município projeto lei', 'Política', null, 'SC', 4, true),
('V8 SC Serviços públicos','"Santa Catarina" hospital escola creche saúde educação fila atendimento prefeitura', 'Serviços Públicos', null, 'SC', 4, true),
('V8 SC Defesa Civil clima','"Santa Catarina" Defesa Civil chuva temporal alagamento enchente alerta previsão', 'Defesa Civil', null, 'SC', 4, true),
('V8 SC Economia e comunidade','"Santa Catarina" economia emprego indústria comércio porto turismo comunidade', 'Economia', null, 'SC', 3, true),
('V8 SC Causa animal','"Santa Catarina" animal cachorro gato maus-tratos resgate abandono polícia ambiental', 'Causa Animal', null, 'SC', 3, true),
('V8 SC Segurança filtrada','"Santa Catarina" polícia operação prisão crime investigação mandado', 'Segurança Pública', null, 'SC', 3, true);

-- 4) Buscas por região. Ajuda a pegar matérias como Oeste/SC-155 mesmo quando não aparece uma cidade grande no título.
insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('V8 Região Oeste','"Oeste de Santa Catarina" OR "Oeste catarinense" Chapecó Concórdia Xanxerê São Miguel do Oeste acidente prefeitura rodovia', 'Radar Regional', null, 'Oeste', 5, true),
('V8 Região Meio-Oeste','"Meio-Oeste catarinense" OR Joaçaba OR Caçador OR Videira OR Fraiburgo acidente prefeitura rodovia', 'Radar Regional', null, 'Meio-Oeste', 4, true),
('V8 Região Sul','"Sul de Santa Catarina" OR "Sul catarinense" Criciúma Tubarão Araranguá Laguna Imbituba notícia acidente prefeitura', 'Radar Regional', null, 'Sul', 4, true),
('V8 Região Norte','"Norte de Santa Catarina" OR Joinville OR Jaraguá do Sul OR São Bento do Sul Mafra Canoinhas notícia acidente prefeitura', 'Radar Regional', null, 'Norte', 4, true),
('V8 Vale do Itajaí','"Vale do Itajaí" Blumenau Brusque Gaspar Indaial Rio do Sul notícia acidente prefeitura', 'Radar Regional', null, 'Vale do Itajaí', 4, true),
('V8 Litoral Norte','"Litoral Norte" Itajaí Balneário Camboriú Camboriú Navegantes Itapema Porto Belo Penha notícia acidente prefeitura', 'Radar Regional', null, 'Litoral Norte', 4, true),
('V8 Grande Florianópolis','"Grande Florianópolis" Florianópolis São José Palhoça Biguaçu Tijucas notícia acidente prefeitura', 'Radar Regional', null, 'Grande Florianópolis', 4, true);

-- 5) Buscas por cidade, com categorias separadas para não vir só segurança pública.
insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('V8 Joinville Geral','Joinville SC notícia hoje prefeitura trânsito saúde educação economia', 'Radar Local', 'Joinville', 'Norte', 5, true),
('V8 Joinville Trânsito','Joinville SC acidente trânsito rodovia carro caminhão vídeo', 'Trânsito/Rodovias', 'Joinville', 'Norte', 5, true),
('V8 Florianópolis Geral','Florianópolis SC Floripa notícia hoje prefeitura trânsito saúde educação turismo', 'Radar Local', 'Florianópolis', 'Grande Florianópolis', 5, true),
('V8 Florianópolis Trânsito','Florianópolis SC Floripa acidente trânsito rodovia carro caminhão vídeo', 'Trânsito/Rodovias', 'Florianópolis', 'Grande Florianópolis', 5, true),
('V8 Blumenau Geral','Blumenau SC notícia hoje prefeitura trânsito saúde educação economia', 'Radar Local', 'Blumenau', 'Vale do Itajaí', 5, true),
('V8 Blumenau Trânsito','Blumenau SC acidente trânsito rodovia carro caminhão vídeo', 'Trânsito/Rodovias', 'Blumenau', 'Vale do Itajaí', 5, true),
('V8 Itajaí Geral','Itajaí SC notícia hoje prefeitura porto trânsito saúde educação', 'Radar Local', 'Itajaí', 'Litoral Norte', 5, true),
('V8 Itajaí Trânsito','Itajaí SC acidente trânsito rodovia carro caminhão vídeo BR-101', 'Trânsito/Rodovias', 'Itajaí', 'Litoral Norte', 5, true),
('V8 Chapecó Geral','Chapecó SC notícia hoje prefeitura trânsito saúde educação economia', 'Radar Local', 'Chapecó', 'Oeste', 4, true),
('V8 Chapecó Trânsito','Chapecó SC acidente trânsito rodovia carro caminhão vídeo Oeste catarinense', 'Trânsito/Rodovias', 'Chapecó', 'Oeste', 4, true),
('V8 Criciúma Geral','Criciúma SC notícia hoje prefeitura trânsito saúde educação economia', 'Radar Local', 'Criciúma', 'Sul', 4, true),
('V8 Criciúma Trânsito','Criciúma SC acidente trânsito rodovia carro caminhão vídeo Sul catarinense', 'Trânsito/Rodovias', 'Criciúma', 'Sul', 4, true),
('V8 Lages Geral','Lages SC notícia hoje prefeitura trânsito saúde educação Serra catarinense', 'Radar Local', 'Lages', 'Serra', 4, true),
('V8 Balneário Camboriú Geral','Balneário Camboriú SC notícia hoje prefeitura trânsito turismo saúde', 'Radar Local', 'Balneário Camboriú', 'Litoral Norte', 4, true),
('V8 Brusque Geral','Brusque SC notícia hoje prefeitura trânsito saúde educação economia', 'Radar Local', 'Brusque', 'Vale do Itajaí', 4, true),
('V8 São José Geral','São José SC notícia hoje prefeitura trânsito saúde educação Grande Florianópolis', 'Radar Local', 'São José', 'Grande Florianópolis', 4, true),
('V8 Palhoça Geral','Palhoça SC notícia hoje prefeitura trânsito saúde educação Grande Florianópolis', 'Radar Local', 'Palhoça', 'Grande Florianópolis', 4, true),
('V8 Jaraguá do Sul Geral','Jaraguá do Sul SC notícia hoje prefeitura trânsito saúde educação', 'Radar Local', 'Jaraguá do Sul', 'Norte/Vale do Itapocu', 4, true);

-- 6) Limpeza conservadora de registros claramente de outros estados.
-- Mantém registros que mencionem Santa Catarina, cidades catarinenses ou rodovias SC/BR catarinenses.
delete from news_items
where (
  lower(coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(source_name,'') || ' ' || coalesce(source_domain,'')) like any(array[
    '%ceará%', '%ceara%', '%policiacivil.ce.gov.br%', '%.ce.gov.br%',
    '%são paulo%', '%sao paulo%', '%.sp.gov.br%',
    '%rio de janeiro%', '%.rj.gov.br%',
    '%minas gerais%', '%.mg.gov.br%',
    '%paraná%', '%parana%', '%.pr.gov.br%',
    '%bahia%', '%.ba.gov.br%',
    '%pernambuco%', '%.pe.gov.br%',
    '%goiás%', '%goias%', '%.go.gov.br%'
  ])
)
and not (lower(coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(source_name,'')) like any(array[
  '%santa catarina%', '%catarinense%', '% sc %', '%joinville%', '%florianópolis%', '%florianopolis%',
  '%blumenau%', '%itajai%', '%itajaí%', '%chapecó%', '%chapeco%', '%criciúma%', '%criciuma%',
  '%lages%', '%brusque%', '%palhoça%', '%palhoca%', '%balneário camboriú%', '%balneario camboriu%',
  '%sc-155%', '%sc 155%', '%br-101%', '%br 101%', '%br-282%', '%br 282%', '%br-470%', '%br 470%'
]));

-- 7) Reclassificação rápida de temas úteis para o painel.
update news_items
set topic = 'Trânsito/Rodovias'
where published_at >= now() - interval '48 hours'
and lower(title || ' ' || coalesce(summary,'')) like any(array['%acidente%', '%rodovia%', '%trânsito%', '%transito%', '%caminhão%', '%caminhao%', '%tombou%', '%br-101%', '%sc-155%']);
