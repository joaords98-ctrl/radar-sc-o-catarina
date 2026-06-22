-- Radar SC — O Catarina
-- Execute este arquivo no SQL Editor do Supabase.
-- Depois configure as variáveis de ambiente no Vercel.

create extension if not exists pgcrypto;

create table if not exists cities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  region text not null,
  population_estimate integer,
  priority_weight numeric not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists competitors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  instagram_handle text not null unique,
  region text,
  category text,
  followers_estimate text,
  contact_commercial text,
  priority integer not null default 3,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists rss_queries (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  query text not null,
  topic text,
  city text,
  region text,
  priority_weight numeric not null default 1,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists news_items (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  title text not null,
  link text not null unique,
  source_name text,
  source_url text,
  published_at timestamptz,
  summary text,
  query_label text,
  topic text,
  city text,
  region text,
  opportunity_score integer not null default 0,
  status text not null default 'novo' check (status in ('novo','reapurar','em_producao','publicado','descartado')),
  angle text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists interactors (
  id uuid primary key default gen_random_uuid(),
  instagram_handle text not null,
  profile_url text,
  source_profile text,
  city text,
  region text,
  temperature text not null default 'morno' check (temperature in ('frio','morno','quente','estrategico','ignorar')),
  interaction_type text,
  notes text,
  last_seen_at timestamptz default now(),
  created_at timestamptz not null default now()
);

create table if not exists editorial_tasks (
  id uuid primary key default gen_random_uuid(),
  news_item_id uuid references news_items(id) on delete cascade,
  task_type text not null,
  status text not null default 'pendente' check (status in ('pendente','fazendo','feito','cancelado')),
  assigned_to text,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists cron_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  inserted_count integer not null default 0,
  skipped_count integer not null default 0,
  error_count integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_news_score on news_items(opportunity_score desc);
create index if not exists idx_news_status on news_items(status);
create index if not exists idx_news_published on news_items(published_at desc);
create index if not exists idx_news_topic_city on news_items(topic, city);
create index if not exists idx_rss_enabled on rss_queries(enabled);

-- Seed: principais cidades catarinenses para prioridade editorial.
insert into cities (name, region, population_estimate, priority_weight) values
('Joinville','Norte',664541,5),
('Florianópolis','Grande Florianópolis',587486,5),
('Blumenau','Vale do Itajaí',385558,5),
('Itajaí','Litoral Norte',291000,5),
('São José','Grande Florianópolis',285000,4),
('Chapecó','Oeste',270000,4),
('Palhoça','Grande Florianópolis',245000,4),
('Criciúma','Sul',225000,4),
('Jaraguá do Sul','Norte/Vale do Itapocu',200000,4),
('Lages','Serra',170000,4),
('Balneário Camboriú','Litoral Norte',160000,4),
('Brusque','Vale do Itajaí',150000,4),
('Tubarão','Sul',115000,3),
('Camboriú','Litoral Norte',110000,3),
('São Bento do Sul','Norte',90000,3),
('Caçador','Meio-Oeste',85000,3),
('Concórdia','Oeste',85000,3),
('Navegantes','Litoral Norte',85000,3),
('Rio do Sul','Alto Vale',75000,3),
('Araranguá','Sul',72000,3),
('Gaspar','Vale do Itajaí',72000,3),
('Biguaçu','Grande Florianópolis',72000,3),
('Indaial','Vale do Itajaí',72000,3),
('Mafra','Norte',60000,2),
('Canoinhas','Planalto Norte',55000,2)
on conflict (name) do update set
  region = excluded.region,
  population_estimate = excluded.population_estimate,
  priority_weight = excluded.priority_weight;

-- Seed: concorrentes e fontes comerciais informadas.
insert into competitors (name, instagram_handle, region, category, followers_estimate, contact_commercial, priority, notes) values
('NSC Total','@nsctotal','SC','Portal estadual','1,2 milhão+','anuncie@nsc.com.br',5,'Alta repercussão estadual'),
('ND Mais','@ndmais','SC','Portal estadual','900 mil+','Grupo ND Comercial',5,'Alta velocidade de publicação'),
('SCC10','@portal.scc10','SC','Portal estadual','700 mil+','Comercial SCC via portal SCC10',5,'Forte em notícias regionais e TV'),
('ClicRDC','@clicrdc','Oeste','Portal regional','500 mil+','Canal de vendas no Linktree oficial',5,'Forte no Oeste'),
('Jornal Razão','@jornalrazao','SC','Portal viral/noticioso','1 milhão+','Direct/comercial',5,'Alta repercussão orgânica'),
('O Município','@omunicipio','Vale do Itajaí','Portal regional','250 mil+','Comercial Grupo O Município',4,'Forte no Vale'),
('Portal Meneghetti','@portalmeneghetti','Oeste','Portal regional','200 mil+','Comercial próprio',4,'Oeste Catarinense'),
('Misturebas News','@misturebasnews','SC','Notícias gerais','150 mil+','Comercial próprio',4,'Notícias gerais SC'),
('Folha Regional SC','@folharegional','Vale do Itajaí','Portal regional','100 mil+','Comercial próprio',3,'Vale do Itajaí'),
('TN Sul','@tnsul','Sul','Portal regional','100 mil+','Comercial próprio',3,'Sul de SC'),
('Jornal Top','@jornaltop','Norte','Portal regional','80 mil+','',3,'Norte de SC'),
('Canal Ideal SC','@canalideal.sc','SC','Regional','70 mil+','',3,'Regional'),
('Portal Agora Notícias','@portalagoranoticias','SC','Regional','60 mil+','',3,'Regional'),
('OBV SC','@obvsc','SC','Ocorrências','250 mil+','',4,'Ocorrências e notícias'),
('Sul in Foco','@sulinfoco','Sul','Portal regional','90 mil+','',3,'Sul Catarinense'),
('Portal Litoral Sul','@portallitoralsul','Litoral Sul','Portal regional','50 mil+','',3,'Litoral Sul'),
('Visor Notícias','@visornoticias','Itajaí e região','Portal regional','120 mil+','',4,'Itajaí e região'),
('Linha Popular','@linhapopular','Oeste/Meio-Oeste','Portal regional','70 mil+','',3,'Oeste e Meio-Oeste'),
('Folha de SC','@folhadesc','SC','Regional','40 mil+','',2,'Regional'),
('Jornal Metas','@jornalmetas','Vale do Itapocu','Portal regional','40 mil+','',2,'Vale do Itapocu'),
('Portal Via Certa','@portalviacerta','Norte','Portal regional','50 mil+','',3,'Norte Catarinense')
on conflict (instagram_handle) do update set
  name = excluded.name,
  region = excluded.region,
  category = excluded.category,
  followers_estimate = excluded.followers_estimate,
  contact_commercial = excluded.contact_commercial,
  priority = excluded.priority,
  notes = excluded.notes;

-- Seed: buscas RSS por tema e cidade.
insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('SC Política geral','Santa Catarina política prefeito vereador deputado governo denúncia','Política',null,'SC',5,true),
('SC Segurança pública','Santa Catarina operação prisão polícia crime segurança pública','Segurança Pública',null,'SC',5,true),
('SC Obras e contratos','Santa Catarina obra licitação contrato sobrepreço Tribunal de Contas prefeitura','Dinheiro Público',null,'SC',5,true),
('SC Enchentes Defesa Civil','Santa Catarina enchente chuva Defesa Civil alagamento barragem','Defesa Civil',null,'SC',4,true),
('SC Saúde e educação','Santa Catarina hospital fila escola creche saúde educação prefeitura','Serviços Públicos',null,'SC',4,true),
('Joinville Radar','Joinville política segurança prefeitura operação obra denúncia','Radar Local','Joinville','Norte',5,true),
('Florianópolis Radar','Florianópolis política segurança prefeitura operação obra denúncia','Radar Local','Florianópolis','Grande Florianópolis',5,true),
('Blumenau Radar','Blumenau política segurança prefeitura operação obra denúncia','Radar Local','Blumenau','Vale do Itajaí',5,true),
('Itajaí Radar','Itajaí política segurança prefeitura operação obra denúncia','Radar Local','Itajaí','Litoral Norte',5,true),
('São José Radar','São José SC política segurança prefeitura operação obra denúncia','Radar Local','São José','Grande Florianópolis',4,true),
('Chapecó Radar','Chapecó política segurança prefeitura operação obra denúncia','Radar Local','Chapecó','Oeste',4,true),
('Palhoça Radar','Palhoça política segurança prefeitura operação obra denúncia','Radar Local','Palhoça','Grande Florianópolis',4,true),
('Criciúma Radar','Criciúma política segurança prefeitura operação obra denúncia','Radar Local','Criciúma','Sul',4,true),
('Jaraguá do Sul Radar','Jaraguá do Sul política segurança prefeitura operação obra denúncia','Radar Local','Jaraguá do Sul','Norte/Vale do Itapocu',4,true),
('Lages Radar','Lages Santa Catarina política segurança prefeitura operação obra denúncia','Radar Local','Lages','Serra',4,true),
('Balneário Camboriú Radar','Balneário Camboriú política segurança prefeitura operação obra denúncia','Radar Local','Balneário Camboriú','Litoral Norte',4,true),
('Brusque Radar','Brusque política segurança prefeitura operação obra denúncia','Radar Local','Brusque','Vale do Itajaí',4,true)
on conflict do nothing;
-- Radar SC v5 — Análise de concorrência e repercussão em outros veículos
-- Rode este arquivo no Supabase SQL Editor após a v4, ou rode o schema.sql completo em projeto novo.

alter table news_items add column if not exists story_key text;
alter table news_items add column if not exists source_domain text;
alter table news_items add column if not exists media_mentions_count integer not null default 1;
alter table news_items add column if not exists media_repercussion_score integer not null default 0;
alter table news_items add column if not exists top_media_sources text[] not null default '{}'::text[];
alter table news_items add column if not exists competitor_hits_count integer not null default 0;
alter table news_items add column if not exists competitor_names text[] not null default '{}'::text[];
alter table news_items add column if not exists competitor_notes text;

create index if not exists idx_news_story_key on news_items(story_key);
create index if not exists idx_news_media_score on news_items(media_repercussion_score desc);
create index if not exists idx_news_source_domain on news_items(source_domain);

create table if not exists source_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text unique,
  instagram_handle text,
  region text,
  category text,
  source_type text not null default 'portal',
  priority_weight integer not null default 3,
  is_competitor boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_source_profiles_competitor on source_profiles(is_competitor, priority_weight desc);

insert into source_profiles (name, domain, instagram_handle, region, category, source_type, priority_weight, is_competitor, notes) values
('NSC Total','nsctotal.com.br','@nsctotal','SC','Portal estadual','portal',5,true,'Alta repercussão estadual'),
('ND Mais','ndmais.com.br','@ndmais','SC','Portal estadual','portal',5,true,'Alta velocidade de publicação'),
('SCC10','scc10.com.br','@portal.scc10','SC','Portal estadual','portal',5,true,'Forte em notícias regionais e TV'),
('ClicRDC','clicrdc.com.br','@clicrdc','Oeste','Portal regional','portal',5,true,'Forte no Oeste'),
('Jornal Razão','jornalrazao.com','@jornalrazao','SC','Portal viral/noticioso','portal',5,true,'Alta repercussão orgânica'),
('O Município','omunicipio.com.br','@omunicipio','Vale do Itajaí','Portal regional','portal',4,true,'Forte no Vale'),
('Portal Meneghetti','portalmeneghetti.com.br','@portalmeneghetti','Oeste','Portal regional','portal',4,true,'Oeste Catarinense'),
('Misturebas News','misturebas.com.br','@misturebasnews','SC','Notícias gerais','portal',4,true,'Notícias gerais SC'),
('Folha Regional SC','folharegionalwebtv.com','@folharegional','Vale do Itajaí','Portal regional','portal',3,true,'Vale do Itajaí'),
('TN Sul','tnsul.com','@tnsul','Sul','Portal regional','portal',3,true,'Sul de SC'),
('Jornal Top','jornaltop.com.br','@jornaltop','Norte','Portal regional','portal',3,true,'Norte de SC'),
('Canal Ideal SC','canalideal.com.br','@canalideal.sc','SC','Regional','portal',3,true,'Regional'),
('Portal Agora Notícias','portalagoranoticias.com.br','@portalagoranoticias','SC','Regional','portal',3,true,'Regional'),
('OBV SC','obvsc.com.br','@obvsc','SC','Ocorrências','portal',4,true,'Ocorrências e notícias'),
('Sul in Foco','sulinfoco.com.br','@sulinfoco','Sul','Portal regional','portal',3,true,'Sul Catarinense'),
('Portal Litoral Sul','portallitoralsul.com.br','@portallitoralsul','Litoral Sul','Portal regional','portal',3,true,'Litoral Sul'),
('Visor Notícias','visornoticias.com.br','@visornoticias','Itajaí e região','Portal regional','portal',4,true,'Itajaí e região'),
('Linha Popular','linhapopular.com.br','@linhapopular','Oeste/Meio-Oeste','Portal regional','portal',3,true,'Oeste e Meio-Oeste'),
('Folha de SC','folhadesc.com.br','@folhadesc','SC','Regional','portal',2,true,'Regional'),
('Jornal Metas','jornalmetas.com.br','@jornalmetas','Vale do Itapocu','Portal regional','portal',2,true,'Vale do Itapocu'),
('Portal Via Certa','portalviacerta.com.br','@portalviacerta','Norte','Portal regional','portal',3,true,'Norte Catarinense'),
('Governo de SC','sc.gov.br',null,'SC','Fonte oficial','oficial',5,false,'Fonte oficial para checagem'),
('Polícia Militar de SC','pm.sc.gov.br',null,'SC','Fonte oficial','oficial',5,false,'Fonte oficial para segurança pública'),
('Polícia Civil de SC','pc.sc.gov.br',null,'SC','Fonte oficial','oficial',5,false,'Fonte oficial para segurança pública'),
('Defesa Civil SC','defesacivil.sc.gov.br',null,'SC','Fonte oficial','oficial',5,false,'Fonte oficial para clima e desastres'),
('MPSC','mpsc.mp.br',null,'SC','Fonte oficial','oficial',5,false,'Fonte oficial jurídica'),
('TCE-SC','tcesc.tc.br',null,'SC','Fonte oficial','oficial',5,false,'Fonte oficial de contas públicas')
on conflict (domain) do update set
  name = excluded.name,
  instagram_handle = excluded.instagram_handle,
  region = excluded.region,
  category = excluded.category,
  source_type = excluded.source_type,
  priority_weight = excluded.priority_weight,
  is_competitor = excluded.is_competitor,
  notes = excluded.notes;

create or replace view story_repercussion as
select
  n.story_key,
  min(n.title) as sample_title,
  max(n.published_at) as latest_published_at,
  count(*) as mentions_count,
  count(distinct coalesce(n.source_name, n.source_domain, 'Fonte não identificada')) as unique_sources_count,
  max(n.media_repercussion_score) as media_repercussion_score,
  max(n.opportunity_score) as max_opportunity_score,
  array_remove(array_agg(distinct n.source_name), null) as sources,
  array_remove(array_agg(distinct cn.competitor_name), null) as competitors
from news_items n
left join lateral unnest(coalesce(n.competitor_names, '{}'::text[])) as cn(competitor_name) on true
where n.story_key is not null
group by n.story_key;


-- Radar SC v5 — Análise de concorrência e repercussão em outros veículos
-- Rode este arquivo no Supabase SQL Editor após a v4, ou rode o schema.sql completo em projeto novo.

alter table news_items add column if not exists story_key text;
alter table news_items add column if not exists source_domain text;
alter table news_items add column if not exists media_mentions_count integer not null default 1;
alter table news_items add column if not exists media_repercussion_score integer not null default 0;
alter table news_items add column if not exists top_media_sources text[] not null default '{}'::text[];
alter table news_items add column if not exists competitor_hits_count integer not null default 0;
alter table news_items add column if not exists competitor_names text[] not null default '{}'::text[];
alter table news_items add column if not exists competitor_notes text;

create index if not exists idx_news_story_key on news_items(story_key);
create index if not exists idx_news_media_score on news_items(media_repercussion_score desc);
create index if not exists idx_news_source_domain on news_items(source_domain);

create table if not exists source_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text unique,
  instagram_handle text,
  region text,
  category text,
  source_type text not null default 'portal',
  priority_weight integer not null default 3,
  is_competitor boolean not null default true,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_source_profiles_competitor on source_profiles(is_competitor, priority_weight desc);

insert into source_profiles (name, domain, instagram_handle, region, category, source_type, priority_weight, is_competitor, notes) values
('NSC Total','nsctotal.com.br','@nsctotal','SC','Portal estadual','portal',5,true,'Alta repercussão estadual'),
('ND Mais','ndmais.com.br','@ndmais','SC','Portal estadual','portal',5,true,'Alta velocidade de publicação'),
('SCC10','scc10.com.br','@portal.scc10','SC','Portal estadual','portal',5,true,'Forte em notícias regionais e TV'),
('ClicRDC','clicrdc.com.br','@clicrdc','Oeste','Portal regional','portal',5,true,'Forte no Oeste'),
('Jornal Razão','jornalrazao.com','@jornalrazao','SC','Portal viral/noticioso','portal',5,true,'Alta repercussão orgânica'),
('O Município','omunicipio.com.br','@omunicipio','Vale do Itajaí','Portal regional','portal',4,true,'Forte no Vale'),
('Portal Meneghetti','portalmeneghetti.com.br','@portalmeneghetti','Oeste','Portal regional','portal',4,true,'Oeste Catarinense'),
('Misturebas News','misturebas.com.br','@misturebasnews','SC','Notícias gerais','portal',4,true,'Notícias gerais SC'),
('Folha Regional SC','folharegionalwebtv.com','@folharegional','Vale do Itajaí','Portal regional','portal',3,true,'Vale do Itajaí'),
('TN Sul','tnsul.com','@tnsul','Sul','Portal regional','portal',3,true,'Sul de SC'),
('Jornal Top','jornaltop.com.br','@jornaltop','Norte','Portal regional','portal',3,true,'Norte de SC'),
('Canal Ideal SC','canalideal.com.br','@canalideal.sc','SC','Regional','portal',3,true,'Regional'),
('Portal Agora Notícias','portalagoranoticias.com.br','@portalagoranoticias','SC','Regional','portal',3,true,'Regional'),
('OBV SC','obvsc.com.br','@obvsc','SC','Ocorrências','portal',4,true,'Ocorrências e notícias'),
('Sul in Foco','sulinfoco.com.br','@sulinfoco','Sul','Portal regional','portal',3,true,'Sul Catarinense'),
('Portal Litoral Sul','portallitoralsul.com.br','@portallitoralsul','Litoral Sul','Portal regional','portal',3,true,'Litoral Sul'),
('Visor Notícias','visornoticias.com.br','@visornoticias','Itajaí e região','Portal regional','portal',4,true,'Itajaí e região'),
('Linha Popular','linhapopular.com.br','@linhapopular','Oeste/Meio-Oeste','Portal regional','portal',3,true,'Oeste e Meio-Oeste'),
('Folha de SC','folhadesc.com.br','@folhadesc','SC','Regional','portal',2,true,'Regional'),
('Jornal Metas','jornalmetas.com.br','@jornalmetas','Vale do Itapocu','Portal regional','portal',2,true,'Vale do Itapocu'),
('Portal Via Certa','portalviacerta.com.br','@portalviacerta','Norte','Portal regional','portal',3,true,'Norte Catarinense'),
('Governo de SC','sc.gov.br',null,'SC','Fonte oficial','oficial',5,false,'Fonte oficial para checagem'),
('Polícia Militar de SC','pm.sc.gov.br',null,'SC','Fonte oficial','oficial',5,false,'Fonte oficial para segurança pública'),
('Polícia Civil de SC','pc.sc.gov.br',null,'SC','Fonte oficial','oficial',5,false,'Fonte oficial para segurança pública'),
('Defesa Civil SC','defesacivil.sc.gov.br',null,'SC','Fonte oficial','oficial',5,false,'Fonte oficial para clima e desastres'),
('MPSC','mpsc.mp.br',null,'SC','Fonte oficial','oficial',5,false,'Fonte oficial jurídica'),
('TCE-SC','tcesc.tc.br',null,'SC','Fonte oficial','oficial',5,false,'Fonte oficial de contas públicas')
on conflict (domain) do update set
  name = excluded.name,
  instagram_handle = excluded.instagram_handle,
  region = excluded.region,
  category = excluded.category,
  source_type = excluded.source_type,
  priority_weight = excluded.priority_weight,
  is_competitor = excluded.is_competitor,
  notes = excluded.notes;

create or replace view story_repercussion as
select
  n.story_key,
  min(n.title) as sample_title,
  max(n.published_at) as latest_published_at,
  count(*) as mentions_count,
  count(distinct coalesce(n.source_name, n.source_domain, 'Fonte não identificada')) as unique_sources_count,
  max(n.media_repercussion_score) as media_repercussion_score,
  max(n.opportunity_score) as max_opportunity_score,
  array_remove(array_agg(distinct n.source_name), null) as sources,
  array_remove(array_agg(distinct cn.competitor_name), null) as competitors
from news_items n
left join lateral unnest(coalesce(n.competitor_names, '{}'::text[])) as cn(competitor_name) on true
where n.story_key is not null
group by n.story_key;


-- Radar SC v6 — Notícias do dia / janela recente
-- Rode depois da v5. O código passa a filtrar por RADAR_RECENT_HOURS, padrão 24h.

create index if not exists idx_news_recent_published on news_items(published_at desc) where published_at is not null;

-- Opcional: se quiser limpar visualmente notícias antigas já importadas como novas,
-- descomente a linha abaixo. Recomendo manter comentado para preservar histórico.
-- update news_items set status = 'descartado' where published_at < now() - interval '7 days' and status = 'novo';

-- As consultas antigas continuam válidas. O código adiciona automaticamente when:1d no Google News
-- e ignora qualquer item com published_at fora da janela recente.


-- Radar SC v7 — campos opcionais para operação editorial.
-- Execute após schema.sql, v5_competition.sql e v6_recent_only.sql.

alter table news_items
  add column if not exists official_source_url text,
  add column if not exists editorial_risk text default 'baixo' check (editorial_risk in ('baixo','medio','alto')),
  add column if not exists suggested_format text default 'site' check (suggested_format in ('site','feed','reels','story','apurar')),
  add column if not exists final_publication_url text,
  add column if not exists assigned_to text,
  add column if not exists deadline_at timestamptz;

create index if not exists idx_news_editorial_risk on news_items(editorial_risk);
create index if not exists idx_news_suggested_format on news_items(suggested_format);
create index if not exists idx_news_deadline_at on news_items(deadline_at);


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


-- Radar SC v9 — busca ativa + reforço de consultas por cidade/rodovia
-- Rode depois da v8. Pode rodar mais de uma vez.

delete from rss_queries where label like 'V9 %';

insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('V9 Vídeos rodovias SC','"Santa Catarina" vídeo acidente caminhão carro tombou rodovia BR-101 BR-282 BR-470 SC-155 SC-283', 'Trânsito/Rodovias', null, 'SC', 6, true),
('V9 SC-155 Oeste','"SC-155" OR "SC 155" caminhão tombou acidente vídeo "Oeste" "Santa Catarina"', 'Trânsito/Rodovias', null, 'Oeste', 6, true),
('V9 BR-101 Litoral','"BR-101" Santa Catarina acidente vídeo trânsito caminhão carro Itajaí Balneário Camboriú Joinville Palhoça', 'Trânsito/Rodovias', null, 'Litoral/Norte', 6, true),
('V9 BR-470 Vale','"BR-470" Santa Catarina acidente trânsito caminhão carro Blumenau Gaspar Indaial Rio do Sul', 'Trânsito/Rodovias', null, 'Vale do Itajaí', 5, true),
('V9 BR-282 Oeste Serra','"BR-282" Santa Catarina acidente trânsito caminhão carro Chapecó Lages Joaçaba', 'Trânsito/Rodovias', null, 'Oeste/Serra', 5, true),
('V9 Política local forte','Santa Catarina prefeitura câmara vereadores prefeito contrato licitação denúncia investigação município', 'Política', null, 'SC', 5, true),
('V9 Saúde local','Santa Catarina hospital atendimento fila emergência saúde prefeitura município', 'Serviços Públicos', null, 'SC', 4, true),
('V9 Educação local','Santa Catarina escola creche educação prefeitura município alunos professores', 'Serviços Públicos', null, 'SC', 4, true),
('V9 Comunidade e cotidiano','Santa Catarina moradores bairro comunidade obra trânsito problema prefeitura', 'Comunidade', null, 'SC', 4, true),
('V9 Causa animal SC','Santa Catarina maus-tratos animal cachorro gato resgate abandono polícia ambiental protetores', 'Causa Animal', null, 'SC', 4, true);

-- Reclassifica vídeos/rodovias recentes que entraram como Geral/Segurança.
update news_items
set topic = 'Trânsito/Rodovias'
where published_at >= now() - interval '72 hours'
and lower(title || ' ' || coalesce(summary,'')) like any(array[
  '%vídeo%', '%video%', '%caminhão%', '%caminhao%', '%tombou%', '%rodovia%', '%br-101%', '%br 101%', '%br-282%', '%br 282%', '%br-470%', '%br 470%', '%sc-155%', '%sc 155%'
])
and lower(title || ' ' || coalesce(summary,'')) like any(array['%acidente%', '%trânsito%', '%transito%', '%rodovia%', '%tombou%']);


-- Radar SC v10 — Instagram Intelligence + reforço de buscas visuais
-- Opcional. Rode depois da v9 para melhorar pautas com vídeo, imagem, cidade e potencial de redes.

update rss_queries
set enabled = false
where label in ('SC Segurança pública');

delete from rss_queries where label like 'V10 %';

insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('V10 Reels SC vídeo forte','"Santa Catarina" vídeo mostra momento flagrante imagens acidente caminhão carro rodovia', 'Trânsito/Rodovias', null, 'SC', 7, true),
('V10 Stories utilidade pública SC','"Santa Catarina" alerta trânsito bloqueio interdição chuva defesa civil serviço hoje', 'Serviços Públicos', null, 'SC', 6, true),
('V10 Carrossel política local SC','"Santa Catarina" prefeito vereadores câmara contrato licitação denúncia investigação município', 'Política', null, 'SC', 6, true),
('V10 Oeste visual','"Oeste de Santa Catarina" vídeo acidente caminhão carro tombou rodovia cidade hoje', 'Trânsito/Rodovias', null, 'Oeste', 6, true),
('V10 Vale visual','"Vale do Itajaí" vídeo acidente trânsito rodovia prefeitura problema moradores hoje', 'Radar Regional', null, 'Vale do Itajaí', 5, true),
('V10 Litoral Norte visual','"Litoral Norte" Itajaí Balneário Camboriú vídeo acidente trânsito turismo prefeitura hoje', 'Radar Regional', null, 'Litoral Norte', 5, true),
('V10 Sul visual','"Sul de Santa Catarina" vídeo acidente trânsito prefeitura moradores Criciúma Tubarão hoje', 'Radar Regional', null, 'Sul', 5, true),
('V10 Joinville Instagram','Joinville vídeo mostra acidente trânsito prefeitura moradores flagrante hoje', 'Radar Local', 'Joinville', 'Norte', 5, true),
('V10 Florianópolis Instagram','Florianópolis Floripa vídeo mostra acidente trânsito prefeitura moradores flagrante hoje', 'Radar Local', 'Florianópolis', 'Grande Florianópolis', 5, true),
('V10 Blumenau Instagram','Blumenau vídeo mostra acidente trânsito prefeitura moradores flagrante hoje', 'Radar Local', 'Blumenau', 'Vale do Itajaí', 5, true),
('V10 Itajaí Instagram','Itajaí vídeo mostra acidente trânsito BR-101 prefeitura moradores flagrante hoje', 'Radar Local', 'Itajaí', 'Litoral Norte', 5, true),
('V10 Chapecó Instagram','Chapecó vídeo mostra acidente trânsito prefeitura moradores flagrante hoje', 'Radar Local', 'Chapecó', 'Oeste', 5, true);

-- Ajuste de tema para pautas visuais que rendem Instagram.
update news_items
set topic = 'Trânsito/Rodovias'
where published_at >= now() - interval '72 hours'
and lower(title || ' ' || coalesce(summary,'')) like any(array[
  '%vídeo%', '%video%', '%flagra%', '%imagens%', '%mostra%', '%câmera%', '%camera%'
])
and lower(title || ' ' || coalesce(summary,'')) like any(array[
  '%acidente%', '%rodovia%', '%trânsito%', '%transito%', '%caminhão%', '%caminhao%', '%carro%', '%tombou%'
]);
-- Radar SC v11 — Clipping inteligente
-- Execute no Supabase depois das versões anteriores.

-- Campos opcionais para operação de clipping, sem quebrar dados antigos.
alter table news_items add column if not exists clipping_priority text default 'normal';
alter table news_items add column if not exists clipping_checked_at timestamptz;
alter table news_items add column if not exists clipping_note text;

create index if not exists idx_news_clipping_priority on news_items(clipping_priority);
create index if not exists idx_news_city_region_published on news_items(city, region, published_at desc);

-- Tabela opcional para registrar resumos/copias do clipping por dia.
create table if not exists clipping_reports (
  id uuid primary key default gen_random_uuid(),
  report_date date not null default current_date,
  period_hours integer not null default 24,
  title text not null default 'Clipping O Catarina',
  summary text,
  total_news integer not null default 0,
  total_stories integer not null default 0,
  urgent_count integer not null default 0,
  unpublished_count integer not null default 0,
  official_source_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_clipping_reports_date on clipping_reports(report_date desc, created_at desc);

-- Reforço de buscas para clipping amplo, não só segurança pública.
insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('Clipping SC Geral Hoje', 'Santa Catarina notícias hoje quando:1d', 'Geral', null, null, 4, true),
('Clipping Cidades SC Hoje', 'Santa Catarina cidades prefeitura saúde educação trânsito economia quando:1d', 'Geral', null, null, 4, true),
('Clipping Rodovias SC Hoje', 'Santa Catarina acidente rodovia BR-101 BR-282 BR-470 SC-155 trânsito vídeo quando:1d', 'Trânsito/Rodovias', null, null, 5, true),
('Clipping Defesa Civil SC Hoje', 'Defesa Civil Santa Catarina alerta chuva temporais deslizamento quando:1d', 'Defesa Civil', null, null, 5, true),
('Clipping Política SC Hoje', 'Santa Catarina política prefeito câmara vereador governo licitação contrato quando:1d', 'Política', null, null, 4, true),
('Clipping Saúde SC Hoje', 'Santa Catarina hospital saúde fila atendimento prefeitura quando:1d', 'Saúde', null, null, 3, true),
('Clipping Educação SC Hoje', 'Santa Catarina escola educação creche professor prefeitura quando:1d', 'Educação', null, null, 3, true),
('Clipping Economia SC Hoje', 'Santa Catarina economia empresa emprego indústria comércio quando:1d', 'Economia', null, null, 3, true),
('Clipping Oeste SC Hoje', 'Oeste de Santa Catarina notícia hoje acidente política saúde quando:1d', 'Geral', null, 'Oeste', 4, true),
('Clipping Vale do Itajaí Hoje', 'Vale do Itajaí Santa Catarina notícia hoje Blumenau Itajaí Brusque quando:1d', 'Geral', null, 'Vale do Itajaí', 4, true),
('Clipping Sul SC Hoje', 'Sul de Santa Catarina Criciúma Tubarão Araranguá notícia hoje quando:1d', 'Geral', null, 'Sul', 4, true),
('Clipping Norte SC Hoje', 'Norte de Santa Catarina Joinville Jaraguá Mafra notícia hoje quando:1d', 'Geral', null, 'Norte', 4, true)
on conflict do nothing;

-- Marca notícias muito fortes para revisão de clipping.
update news_items
set clipping_priority = 'alta'
where clipping_priority = 'normal'
  and coalesce(opportunity_score, 0) >= 80;

-- v13 — Redação Enxuta / Enviar para pauta
alter table if exists editorial_tasks
  add column if not exists notes text;

alter table if exists editorial_tasks
  add column if not exists priority integer not null default 0;

create index if not exists idx_editorial_tasks_type_status_created
  on editorial_tasks(task_type, status, created_at desc);

create index if not exists idx_editorial_tasks_news_status
  on editorial_tasks(news_item_id, status);

-- Radar SC v13.1 — Fonte Donna da Notícia
insert into source_profiles (name, domain, instagram_handle, region, category, source_type, priority_weight, is_competitor, notes) values
('Donna da Notícia','donnadanoticia.com.br','@donnadanoticia.com.br','Sul/Tubarão','Portal regional','portal',4,true,'Portal regional com cobertura de SC, Tubarão e região')
on conflict (domain) do update set
  name = excluded.name,
  instagram_handle = excluded.instagram_handle,
  region = excluded.region,
  category = excluded.category,
  source_type = excluded.source_type,
  priority_weight = excluded.priority_weight,
  is_competitor = excluded.is_competitor,
  notes = excluded.notes;

delete from rss_queries where label like 'V13.1 Donna%';

insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('V13.1 Donna da Notícia Geral','site:donnadanoticia.com.br Santa Catarina OR SC OR Tubarão','Radar Local','Tubarão','Sul',5,true),
('V13.1 Donna da Notícia Segurança','site:donnadanoticia.com.br segurança polícia acidente rodovia Tubarão Santa Catarina','Segurança Pública','Tubarão','Sul',4,true),
('V13.1 Donna da Notícia Serviços','site:donnadanoticia.com.br prefeitura saúde educação Procon Defesa Civil Tubarão Santa Catarina','Serviços Públicos','Tubarão','Sul',4,true),
('V13.1 Donna da Notícia Política SC','site:donnadanoticia.com.br governo Jorginho prefeitura vereador deputado Santa Catarina','Política',null,'SC',4,true);

-- Radar SC v13.2 — Portais estratégicos de Santa Catarina
-- Adiciona portais estaduais, regionais e nacionais com páginas/tags focadas em SC.

insert into source_profiles (name, domain, instagram_handle, region, category, source_type, priority_weight, is_competitor, notes) values
('NSC Total','nsctotal.com.br','@nsctotal','SC','Portal estadual','portal',5,true,'Portal estadual de alta relevância para SC'),
('G1','g1.globo.com','@g1','SC','Portal nacional/editoria SC','portal',5,true,'Editorias e notícias de Santa Catarina no G1'),
('Diarinho','diarinho.net','@jornaldiarinho','Itajaí/Litoral Norte','Portal regional','portal',5,true,'Forte no Litoral Norte, Itajaí e Balneário Camboriú'),
('Imagem da Ilha','imagemdailha.com.br','@imagemdailha','Grande Florianópolis','Portal regional','portal',4,true,'Cobertura de Florianópolis e região'),
('CNN Brasil','cnnbrasil.com.br','@cnnbrasil','SC/Nacional','Portal nacional','portal',4,true,'Tag e cobertura nacional sobre Santa Catarina'),
('SCC10','scc10.com.br','@portal.scc10','SC','Portal estadual','portal',5,true,'Portal estadual e TV com cobertura regional'),
('Santa Catarina em Pauta','santacatarinaempauta.com.br',null,'SC','Política/SC','portal',4,true,'Cobertura política e estadual'),
('GZH','gauchazh.clicrbs.com.br','@gauchazh','SC/RS','Portal regional/nacional','portal',3,true,'Tag de Santa Catarina no GZH'),
('Folha de S.Paulo','folha.uol.com.br',null,'SC/Nacional','Portal nacional','portal',3,true,'Tópicos de Santa Catarina na Folha'),
('RCN Online','rcnonline.com.br',null,'SC','Portal regional','portal',4,true,'Cobertura regional de Santa Catarina'),
('UOL Notícias','noticias.uol.com.br',null,'SC/Nacional','Portal nacional','portal',3,true,'Editorias e notícias de Santa Catarina no UOL'),
('Correio SC','correiosc.com.br',null,'SC','Portal regional','portal',4,true,'Portal regional catarinense'),
('Gazeta SBS','gazetasbs.com.br',null,'São Bento do Sul/Planalto Norte','Portal regional','portal',4,true,'Forte em São Bento do Sul e Planalto Norte'),
('SC Portais','scportais.com.br',null,'SC','Agregador/portal estadual','portal',4,true,'Portal catarinense com notícias regionais'),
('Tudo Aqui SC','tudoaquisc.com.br',null,'SC','Portal regional','portal',4,true,'Portal com cobertura regional de SC'),
('Blog do Prisco','blogdoprisco.com.br',null,'SC','Política/SC','portal',5,true,'Fonte relevante para política catarinense')
on conflict (domain) do update set
  name = excluded.name,
  instagram_handle = excluded.instagram_handle,
  region = excluded.region,
  category = excluded.category,
  source_type = excluded.source_type,
  priority_weight = excluded.priority_weight,
  is_competitor = excluded.is_competitor,
  notes = excluded.notes;

-- Evita duplicar consultas se o arquivo for rodado mais de uma vez.
delete from rss_queries where label like 'V13.2 Portal%';

insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('V13.2 Portal NSC Total','site:nsctotal.com.br Santa Catarina OR SC','Radar Estadual',null,'SC',5,true),
('V13.2 Portal G1 SC','site:g1.globo.com/sc/santa-catarina Santa Catarina OR SC','Radar Estadual',null,'SC',5,true),
('V13.2 Portal Diarinho','site:diarinho.net Itajaí OR Balneário Camboriú OR Santa Catarina OR SC','Radar Local','Itajaí','Litoral Norte',5,true),
('V13.2 Portal Imagem da Ilha','site:imagemdailha.com.br Florianópolis OR Floripa OR Santa Catarina','Radar Local','Florianópolis','Grande Florianópolis',4,true),
('V13.2 Portal CNN SC','site:cnnbrasil.com.br/tudo-sobre/santa-catarina Santa Catarina OR SC','Radar Nacional/SC',null,'SC',4,true),
('V13.2 Portal SCC10','site:scc10.com.br Santa Catarina OR SC','Radar Estadual',null,'SC',5,true),
('V13.2 Portal Santa Catarina em Pauta','site:santacatarinaempauta.com.br Santa Catarina OR governo OR Alesc OR Jorginho','Política',null,'SC',5,true),
('V13.2 Portal GZH SC','site:gauchazh.clicrbs.com.br/ultimas-noticias/tag/santa-catarina Santa Catarina OR SC','Radar Nacional/SC',null,'SC',3,true),
('V13.2 Portal Folha SC','site:folha.uol.com.br/folha-topicos/santa-catarina-estado Santa Catarina OR SC','Radar Nacional/SC',null,'SC',3,true),
('V13.2 Portal RCN Online','site:rcnonline.com.br Santa Catarina OR SC','Radar Local',null,'SC',4,true),
('V13.2 Portal UOL SC','site:noticias.uol.com.br/santa-catarina/noticias Santa Catarina OR SC','Radar Nacional/SC',null,'SC',3,true),
('V13.2 Portal Correio SC','site:correiosc.com.br Santa Catarina OR SC','Radar Local',null,'SC',4,true),
('V13.2 Portal Gazeta SBS','site:gazetasbs.com.br São Bento do Sul OR Sao Bento do Sul OR Santa Catarina','Radar Local','São Bento do Sul','Planalto Norte',4,true),
('V13.2 Portal SC Portais','site:scportais.com.br Santa Catarina OR SC','Radar Estadual',null,'SC',4,true),
('V13.2 Portal Tudo Aqui SC','site:tudoaquisc.com.br Santa Catarina OR SC','Radar Local',null,'SC',4,true),
('V13.2 Portal Blog do Prisco','site:blogdoprisco.com.br Santa Catarina OR política OR governo OR Alesc OR Jorginho','Política',null,'SC',5,true),
('V13.2 Portal Rodovias SC','(site:nsctotal.com.br OR site:g1.globo.com/sc/santa-catarina OR site:scc10.com.br OR site:diarinho.net) acidente OR rodovia OR BR-101 OR BR-282 OR BR-470 OR SC-155 Santa Catarina','Trânsito/Rodovias',null,'SC',5,true),
('V13.2 Portal Política SC','(site:blogdoprisco.com.br OR site:santacatarinaempauta.com.br OR site:nsctotal.com.br OR site:g1.globo.com/sc/santa-catarina) governo OR Alesc OR deputado OR prefeito OR vereador Santa Catarina','Política',null,'SC',5,true);



-- Radar SC v13.3 — Portais Oeste/Regionais
-- Adiciona portais pedidos pelo usuário para ampliar cobertura do Oeste e notícias regionais de SC.

insert into source_profiles (name, domain, instagram_handle, region, category, source_type, priority_weight, is_competitor, notes) values
('Oeste Mais','oestemais.com',null,'Oeste/Meio-Oeste','Portal regional','portal',5,true,'Fonte regional para Oeste catarinense, rodovias, política, segurança e serviços'),
('Click Xaxim','clickxaxim.com.br',null,'Xaxim/Oeste','Portal regional','portal',4,true,'Fonte local para Xaxim e Oeste de SC'),
('Nova FM 103','novafm103.com.br',null,'Oeste','Rádio/portal regional','portal',4,true,'Rádio e portal regional com notícias do Oeste catarinense'),
('DI Regional','diregional.com.br',null,'SC/Regional','Portal regional','portal',4,true,'Portal regional de notícias de Santa Catarina'),
('ClicRDC','clicrdc.com.br','@clicrdc','Chapecó/Oeste','Portal regional','portal',5,true,'Fonte forte no Oeste catarinense e Chapecó'),
('Agência ICEM','agenciaicem.com.br',null,'SC/Regional','Agência/portal regional','portal',4,true,'Agência regional para monitoramento de notícias catarinenses')
on conflict (domain) do update set
  name = excluded.name,
  instagram_handle = excluded.instagram_handle,
  region = excluded.region,
  category = excluded.category,
  source_type = excluded.source_type,
  priority_weight = excluded.priority_weight,
  is_competitor = excluded.is_competitor,
  notes = excluded.notes;

-- Evita duplicar consultas se o arquivo for rodado mais de uma vez.
delete from rss_queries where label like 'V13.3 Portal%';

insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('V13.3 Portal Oeste Mais Geral','site:oestemais.com Santa Catarina OR SC OR Oeste OR Chapecó OR Concórdia OR Xanxerê','Radar Oeste',null,'Oeste',5,true),
('V13.3 Portal Oeste Mais Rodovias','site:oestemais.com acidente OR rodovia OR SC-155 OR BR-282 OR BR-153 OR Oeste Santa Catarina','Trânsito/Rodovias',null,'Oeste',5,true),
('V13.3 Portal Oeste Mais Política','site:oestemais.com prefeitura OR vereador OR deputado OR governo OR eleição OR política Santa Catarina','Política',null,'Oeste',4,true),
('V13.3 Portal Click Xaxim','site:clickxaxim.com.br Xaxim OR Oeste OR Santa Catarina OR SC','Radar Local','Xaxim','Oeste',4,true),
('V13.3 Portal Click Xaxim Segurança','site:clickxaxim.com.br polícia OR acidente OR bombeiros OR rodovia Xaxim Santa Catarina','Segurança Pública','Xaxim','Oeste',4,true),
('V13.3 Portal Nova FM 103','site:novafm103.com.br/noticias Oeste OR Santa Catarina OR SC OR Chapecó OR Maravilha OR Pinhalzinho','Radar Oeste',null,'Oeste',4,true),
('V13.3 Portal Nova FM 103 Serviços','site:novafm103.com.br/noticias prefeitura OR saúde OR educação OR Defesa Civil Santa Catarina','Serviços Públicos',null,'Oeste',4,true),
('V13.3 Portal DI Regional','site:diregional.com.br Santa Catarina OR SC OR Oeste OR política OR segurança','Radar Regional',null,'SC',4,true),
('V13.3 Portal ClicRDC','site:clicrdc.com.br Chapecó OR Oeste OR Santa Catarina OR SC','Radar Oeste','Chapecó','Oeste',5,true),
('V13.3 Portal ClicRDC Segurança','site:clicrdc.com.br polícia OR acidente OR bombeiros OR rodovia Chapecó Oeste Santa Catarina','Segurança Pública','Chapecó','Oeste',5,true),
('V13.3 Portal ClicRDC Política','site:clicrdc.com.br prefeitura OR governo OR vereador OR deputado OR política Santa Catarina','Política','Chapecó','Oeste',4,true),
('V13.3 Portal Agência ICEM','site:agenciaicem.com.br Santa Catarina OR SC OR política OR segurança OR Oeste','Radar Regional',null,'SC',4,true),
('V13.3 Portal Oeste Combo','(site:oestemais.com OR site:clickxaxim.com.br OR site:clicrdc.com.br OR site:novafm103.com.br) Santa Catarina OR Oeste OR Chapecó OR Xaxim OR Xanxerê OR Concórdia','Radar Oeste',null,'Oeste',5,true);


-- Radar SC v13.4 — Fontes regionais e redes por praça
-- Cadastro ampliado de veículos regionais, rádios, TVs, portais e perfis sociais informados pelo usuário.
-- Observação: perfis de Instagram/Facebook ficam cadastrados como fontes sociais/concorrentes; o Radar não faz scraping de redes sociais.

insert into source_profiles (name, domain, instagram_handle, region, category, source_type, priority_weight, is_competitor, notes) values
('NSC Total','nsctotal.com.br','@nsctotal','SC','Portal estadual','portal',5,true,'Já cadastrado; reforço para SC e NSC TV'),
('ND Mais / NDTV','ndmais.com.br','@ndmais','SC','Portal/TV estadual','portal',5,true,'NDTV regionais: Blumenau, Oeste, Criciúma, Floripa, Itajaí, Joinville, Lages, Meio-Oeste'),
('SCC10 / SCC SBT','scc10.com.br','@sccsbt','SC','Portal/TV estadual','portal',5,true,'SCC SBT e SCC10'),
('DIARINHO','diarinho.net','@jornaldiarinho','Itajaí/Litoral Norte','Portal regional','portal',5,true,'Itajaí, Balneário Camboriú e litoral'),
('Imagem da Ilha','imagemdailha.com.br','@imagemdailha','Grande Florianópolis','Portal regional','portal',4,true,'Florianópolis e Grande Florianópolis'),
('ClicRDC','clicrdc.com.br','@clicrdc','Chapecó/Oeste','Portal regional','portal',5,true,'Chapecó/Oeste'),
('O Município','omunicipio.com.br','@omunicipiobrusque','Brusque/Vale do Itajaí','Portal regional','portal',4,true,'Brusque e Vale'),
('Olhar do Vale','olhardovale.com.br','@portalolhardovale','Brusque/Vale do Itajaí','Portal regional','portal',4,true,'Brusque e Vale do Itajaí'),
('Diário do Iguaçu','diariodoiguacu.com.br','@diariodoiguacu','Chapecó/Oeste','Portal regional','portal',4,true,'Chapecó e Oeste'),
('Portal Engeplus','engeplus.com.br','@portalengeplus','Criciúma/Sul','Portal regional','portal',5,true,'Criciúma e Sul'),
('4oito','4oito.com.br','@4oito','Criciúma/Sul','Portal/radio regional','portal',4,true,'Criciúma e Sul'),
('Portal Litoral Sul','portallitoralsul.com.br','@portallitoralsul','Sul/Litoral Sul','Portal regional','portal',4,true,'Litoral Sul'),
('Itajaí Digital','itajaidigital.com.br',null,'Itajaí/Litoral Norte','Portal regional','portal',4,true,'Itajaí Digital / notícias'),
('Notisul','notisul.com.br','@notisul','Tubarão/Sul','Portal regional','portal',4,true,'Tubarão e Sul'),
('HC Notícias','hcnoticias.com.br','@hcnoticias','Tubarão/Sul','Portal regional','portal',4,true,'Tubarão e Sul'),
('Diário do Sul','diariodosul.com.br','@diariodosul','Tubarão/Sul','Portal regional','portal',4,true,'Tubarão e Sul'),
('Notícia no Ato','noticianoato.com.br','@noticianoato','Lages/Serra','Portal regional','portal',4,true,'Lages e Serra'),
('Correio Lageano','correiolageano.com.br','@correiolageano','Lages/Serra','Portal regional','portal',4,true,'Lages e Serra'),
('Lages Online','lagesonline.com.br','@lagesonline','Lages/Serra','Portal regional','portal',4,true,'Lages e Serra'),
('O Diário','odiario.net','@odiarionet','Concórdia/Oeste','Portal regional','portal',4,true,'Concórdia e Oeste'),
('Portal Concórdia','portalconcordia.com.br','@portalconcordia','Concórdia/Oeste','Portal regional','portal',4,true,'Concórdia e Oeste'),
('Notícia Hoje','noticiahoje.com.br','@noticiahoje','Caçador/Meio-Oeste','Portal regional','portal',4,true,'Caçador e Meio-Oeste'),
('Caçador Online','cacadoronline.com.br','@cacadoronline','Caçador/Meio-Oeste','Portal regional','portal',4,true,'Caçador e Meio-Oeste'),
('Portal RBV','portalrbv.com.br','@portalrbv','Meio-Oeste','Portal regional','portal',4,true,'Meio-Oeste'),
('NSC TV Oficial','instagram.com/nsctvoficial','@nsctvoficial','SC','TV/portal estadual','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('NSC Total','instagram.com/nsctotal','@nsctotal','SC','Portal estadual','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('ND Mais','instagram.com/ndmais','@ndmais','SC','Portal estadual','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('NDTV Blumenau','instagram.com/ndtvblumenau','@ndtvblumenau','Blumenau/Vale do Itajaí','TV regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('TV Galega','instagram.com/tvgalega.oficial','@tvgalega.oficial','Blumenau/Vale do Itajaí','TV regional/social','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Rádio Menina Blumenau','instagram.com/meninafmblu','@meninafmblu','Blumenau/Vale do Itajaí','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Massa FM Blumenau','instagram.com/massafmblumenau','@massafmblumenau','Blumenau/Vale do Itajaí','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('União FM 96.5','instagram.com/uniaofm965','@uniaofm965','Blumenau/Vale do Itajaí','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Mesorregional','instagram.com/mesorregional','@mesorregional','Vale do Itajaí','Portal regional/social','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Informe BNU','instagram.com/informeblumenau','@informeblumenau','Blumenau/Vale do Itajaí','Portal regional/social','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Rádio Cidade Brusque','instagram.com/radiocidadebrusque','@radiocidadebrusque','Brusque/Vale do Itajaí','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Diplomata FM','instagram.com/diplomatafm','@diplomatafm','Brusque/Vale do Itajaí','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Araguaia Brusque','instagram.com/araguaiabq','@araguaiabq','Brusque/Vale do Itajaí','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('O Município Brusque','instagram.com/omunicipiobrusque','@omunicipiobrusque','Brusque/Vale do Itajaí','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Portal da Cidade Brusque','instagram.com/portaldacidadebrusque','@portaldacidadebrusque','Brusque/Vale do Itajaí','Portal regional/social','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Olhar do Vale','instagram.com/portalolhardovale','@portalolhardovale','Brusque/Vale do Itajaí','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Oeste Capital FM','instagram.com/radiooestecapitalfm','@radiooestecapitalfm','Chapecó/Oeste','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Rádio Chapecó','instagram.com/radiochapeco','@radiochapeco','Chapecó/Oeste','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Clube FM Chapecó','instagram.com/clubefm.chapeco','@clubefm.chapeco','Chapecó/Oeste','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Massa FM Chapecó','instagram.com/massafmchapeco','@massafmchapeco','Chapecó/Oeste','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('ClicRDC','instagram.com/clicrdc','@clicrdc','Chapecó/Oeste','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Diário do Iguaçu','instagram.com/diariodoiguacu','@diariodoiguacu','Chapecó/Oeste','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('NDTV Oeste','instagram.com/ndtvoeste','@ndtvoeste','Chapecó/Oeste','TV regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('NDTV Criciúma','instagram.com/ndtvcriciuma','@ndtvcriciuma','Criciúma/Sul','TV regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Som Maior','instagram.com/radiosommaior','@radiosommaior','Criciúma/Sul','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Rádio Eldorado Criciúma','instagram.com/radioeldoradocriciuma','@radioeldoradocriciuma','Criciúma/Sul','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Massa FM Criciúma','instagram.com/massafmcriciuma','@massafmcriciuma','Criciúma/Sul','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Portal Engeplus','instagram.com/portalengeplus','@portalengeplus','Criciúma/Sul','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('4oito','instagram.com/4oito','@4oito','Criciúma/Sul','Portal/radio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Portal Litoral Sul','instagram.com/portallitoralsul','@portallitoralsul','Sul/Litoral Sul','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('NDTV Floripa','instagram.com/ndtvfloripa','@ndtvfloripa','Grande Florianópolis','TV regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('SCC SBT','instagram.com/sccsbt','@sccsbt','SC','TV estadual','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Record News SC','instagram.com/recordnews_sc','@recordnews_sc','SC','TV estadual','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Jovem Pan News Floripa','instagram.com/jovempannewsfloripa','@jovempannewsfloripa','Grande Florianópolis','Rádio/TV news','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Jovem Pan Floripa','instagram.com/jovempanfloripa','@jovempanfloripa','Grande Florianópolis','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Atlântida Floripa','instagram.com/atlantidafloripa','@atlantidafloripa','Grande Florianópolis','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('CBN Floripa','instagram.com/cbnfloripa','@cbnfloripa','Grande Florianópolis','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Imagem da Ilha','instagram.com/imagemdailha','@imagemdailha','Grande Florianópolis','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('NDTV Itajaí','instagram.com/ndtvitajai','@ndtvitajai','Itajaí/Litoral Norte','TV regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Transamérica Balneário Camboriú','instagram.com/transamericabalneariocamboriu','@transamericabalneariocamboriu','Balneário Camboriú/Litoral Norte','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Univali FM','instagram.com/univalifm','@univalifm','Itajaí/Litoral Norte','Rádio universitária','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Rádio Conceição FM','instagram.com/radioconceicaofm','@radioconceicaofm','Itajaí/Litoral Norte','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Massa FM Litoral','instagram.com/massafmlitoral','@massafmlitoral','Litoral Norte','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('DIARINHO','instagram.com/jornaldiarinho','@jornaldiarinho','Itajaí/Litoral Norte','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('NDTV Joinville','instagram.com/ndtvjoinville','@ndtvjoinville','Joinville/Norte','TV regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('TVBE Joinville','instagram.com/tvbejlleoficial','@tvbejlleoficial','Joinville/Norte','TV regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Jovem Pan Joinville','instagram.com/jovempanjoinville','@jovempanjoinville','Joinville/Norte','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Rádio 89FM Joinville','instagram.com/89fmjoinville','@89fmjoinville','Joinville/Norte','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('CBN Joinville','instagram.com/cbnjoinville','@cbnjoinville','Joinville/Norte','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Ponto Norte Joinville','instagram.com/pontonortejoinville','@pontonortejoinville','Joinville/Norte','Portal regional/social','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Amanda FM','instagram.com/amanda.fm','@amanda.fm','Alto Vale','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Rádio Mirador','instagram.com/radiomiradoroficial','@radiomiradoroficial','Alto Vale','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Unidavi FM','instagram.com/radiounidavi','@radiounidavi','Alto Vale','Rádio universitária','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Massa FM Rio do Sul','instagram.com/massafmriodosul','@massafmriodosul','Rio do Sul/Alto Vale','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Diário do Alto Vale / Correio Lageano','instagram.com/correiolageano','@correiolageano','Alto Vale/Serra','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('GCD Notícias / Vale Notícias','instagram.com/vale.noticias','@vale.noticias','Alto Vale','Portal regional/social','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('UniTV','instagram.com/unitv','@unitv','Alto Vale/SC','TV universitária/regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Rádio Tubá','instagram.com/radiotuba','@radiotuba','Tubarão/Sul','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Jovem Pan Tubarão','instagram.com/jpnewstubarao','@jpnewstubarao','Tubarão/Sul','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Band FM Tubarão','instagram.com/bandfmtubarao','@bandfmtubarao','Tubarão/Sul','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Notisul','instagram.com/notisul','@notisul','Tubarão/Sul','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('HC Notícias','instagram.com/hcnoticias','@hcnoticias','Tubarão/Sul','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Diário do Sul','instagram.com/diariodosul','@diariodosul','Tubarão/Sul','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('NDTV Lages','instagram.com/ndtvlages','@ndtvlages','Lages/Serra','TV regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Rádio Clube Lages','instagram.com/radioclubelages','@radioclubelages','Lages/Serra','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Massa FM Lages','instagram.com/massafmlages','@massafmlages','Lages/Serra','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Rádio Menina Lages','instagram.com/meninalages','@meninalages','Lages/Serra','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Notícia no Ato','instagram.com/noticianoato','@noticianoato','Lages/Serra','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Lages Online','instagram.com/lagesonline','@lagesonline','Lages/Serra','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('TV Concórdia','instagram.com/tvconcordia','@tvconcordia','Concórdia/Oeste','TV regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Atual FM','instagram.com/atualfm','@atualfm','Concórdia/Oeste','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Rádio Rural Concórdia','instagram.com/radioruralconcordia','@radioruralconcordia','Concórdia/Oeste','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Rádio Aliança','instagram.com/radio_alianca','@radio_alianca','Concórdia/Oeste','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Massa FM Concórdia','instagram.com/massaconcordia101','@massaconcordia101','Concórdia/Oeste','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('O Diário','instagram.com/odiarionet','@odiarionet','Concórdia/Oeste','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Portal da Cidade Concórdia','instagram.com/portalconcordia','@portalconcordia','Concórdia/Oeste','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('NDTV Meio-Oeste','instagram.com/ndtvmeiooeste','@ndtvmeiooeste','Meio-Oeste','TV regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Rádio Caçanjurê','instagram.com/radiocacanjure','@radiocacanjure','Caçador/Meio-Oeste','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Rádio 92 FM Caçador','instagram.com/radio92fmcacador','@radio92fmcacador','Caçador/Meio-Oeste','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Rádio Videira','instagram.com/radiovideira','@radiovideira','Videira/Meio-Oeste','Rádio regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Notícia Hoje','instagram.com/noticiahoje','@noticiahoje','Caçador/Meio-Oeste','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Caçador Online','instagram.com/cacadoronline','@cacadoronline','Caçador/Meio-Oeste','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.'),
('Portal RBV','instagram.com/portalrbv','@portalrbv','Meio-Oeste','Portal regional','social',3,true,'Fonte social cadastrada para monitoramento manual e análise de concorrência; não gera scraping automático.')
on conflict (domain) do update set
  name = excluded.name,
  instagram_handle = excluded.instagram_handle,
  region = excluded.region,
  category = excluded.category,
  source_type = excluded.source_type,
  priority_weight = excluded.priority_weight,
  is_competitor = excluded.is_competitor,
  notes = excluded.notes;

insert into competitors (name, instagram_handle, region, category, followers_estimate, contact_commercial, priority, notes) values
('NSC TV Oficial','@nsctvoficial','SC','TV/portal estadual',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('NSC Total','@nsctotal','SC','Portal estadual',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('ND Mais','@ndmais','SC','Portal estadual',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('NDTV Blumenau','@ndtvblumenau','Blumenau/Vale do Itajaí','TV regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('TV Galega','@tvgalega.oficial','Blumenau/Vale do Itajaí','TV regional/social',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Rádio Menina Blumenau','@meninafmblu','Blumenau/Vale do Itajaí','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Massa FM Blumenau','@massafmblumenau','Blumenau/Vale do Itajaí','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('União FM 96.5','@uniaofm965','Blumenau/Vale do Itajaí','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Mesorregional','@mesorregional','Vale do Itajaí','Portal regional/social',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Informe BNU','@informeblumenau','Blumenau/Vale do Itajaí','Portal regional/social',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Rádio Cidade Brusque','@radiocidadebrusque','Brusque/Vale do Itajaí','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Diplomata FM','@diplomatafm','Brusque/Vale do Itajaí','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Araguaia Brusque','@araguaiabq','Brusque/Vale do Itajaí','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('O Município Brusque','@omunicipiobrusque','Brusque/Vale do Itajaí','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Portal da Cidade Brusque','@portaldacidadebrusque','Brusque/Vale do Itajaí','Portal regional/social',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Olhar do Vale','@portalolhardovale','Brusque/Vale do Itajaí','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Oeste Capital FM','@radiooestecapitalfm','Chapecó/Oeste','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Rádio Chapecó','@radiochapeco','Chapecó/Oeste','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Clube FM Chapecó','@clubefm.chapeco','Chapecó/Oeste','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Massa FM Chapecó','@massafmchapeco','Chapecó/Oeste','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('ClicRDC','@clicrdc','Chapecó/Oeste','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Diário do Iguaçu','@diariodoiguacu','Chapecó/Oeste','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('NDTV Oeste','@ndtvoeste','Chapecó/Oeste','TV regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('NDTV Criciúma','@ndtvcriciuma','Criciúma/Sul','TV regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Som Maior','@radiosommaior','Criciúma/Sul','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Rádio Eldorado Criciúma','@radioeldoradocriciuma','Criciúma/Sul','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Massa FM Criciúma','@massafmcriciuma','Criciúma/Sul','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Portal Engeplus','@portalengeplus','Criciúma/Sul','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('4oito','@4oito','Criciúma/Sul','Portal/radio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Portal Litoral Sul','@portallitoralsul','Sul/Litoral Sul','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('NDTV Floripa','@ndtvfloripa','Grande Florianópolis','TV regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('SCC SBT','@sccsbt','SC','TV estadual',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Record News SC','@recordnews_sc','SC','TV estadual',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Jovem Pan News Floripa','@jovempannewsfloripa','Grande Florianópolis','Rádio/TV news',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Jovem Pan Floripa','@jovempanfloripa','Grande Florianópolis','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Atlântida Floripa','@atlantidafloripa','Grande Florianópolis','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('CBN Floripa','@cbnfloripa','Grande Florianópolis','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Imagem da Ilha','@imagemdailha','Grande Florianópolis','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('NDTV Itajaí','@ndtvitajai','Itajaí/Litoral Norte','TV regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Transamérica Balneário Camboriú','@transamericabalneariocamboriu','Balneário Camboriú/Litoral Norte','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Univali FM','@univalifm','Itajaí/Litoral Norte','Rádio universitária',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Rádio Conceição FM','@radioconceicaofm','Itajaí/Litoral Norte','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Massa FM Litoral','@massafmlitoral','Litoral Norte','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('DIARINHO','@jornaldiarinho','Itajaí/Litoral Norte','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('NDTV Joinville','@ndtvjoinville','Joinville/Norte','TV regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('TVBE Joinville','@tvbejlleoficial','Joinville/Norte','TV regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Jovem Pan Joinville','@jovempanjoinville','Joinville/Norte','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Rádio 89FM Joinville','@89fmjoinville','Joinville/Norte','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('CBN Joinville','@cbnjoinville','Joinville/Norte','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Ponto Norte Joinville','@pontonortejoinville','Joinville/Norte','Portal regional/social',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Amanda FM','@amanda.fm','Alto Vale','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Rádio Mirador','@radiomiradoroficial','Alto Vale','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Unidavi FM','@radiounidavi','Alto Vale','Rádio universitária',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Massa FM Rio do Sul','@massafmriodosul','Rio do Sul/Alto Vale','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Diário do Alto Vale / Correio Lageano','@correiolageano','Alto Vale/Serra','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('GCD Notícias / Vale Notícias','@vale.noticias','Alto Vale','Portal regional/social',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('UniTV','@unitv','Alto Vale/SC','TV universitária/regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Rádio Tubá','@radiotuba','Tubarão/Sul','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Jovem Pan Tubarão','@jpnewstubarao','Tubarão/Sul','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Band FM Tubarão','@bandfmtubarao','Tubarão/Sul','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Notisul','@notisul','Tubarão/Sul','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('HC Notícias','@hcnoticias','Tubarão/Sul','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Diário do Sul','@diariodosul','Tubarão/Sul','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('NDTV Lages','@ndtvlages','Lages/Serra','TV regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Rádio Clube Lages','@radioclubelages','Lages/Serra','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Massa FM Lages','@massafmlages','Lages/Serra','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Rádio Menina Lages','@meninalages','Lages/Serra','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Notícia no Ato','@noticianoato','Lages/Serra','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Lages Online','@lagesonline','Lages/Serra','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('TV Concórdia','@tvconcordia','Concórdia/Oeste','TV regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Atual FM','@atualfm','Concórdia/Oeste','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Rádio Rural Concórdia','@radioruralconcordia','Concórdia/Oeste','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Rádio Aliança','@radio_alianca','Concórdia/Oeste','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Massa FM Concórdia','@massaconcordia101','Concórdia/Oeste','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('O Diário','@odiarionet','Concórdia/Oeste','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Portal da Cidade Concórdia','@portalconcordia','Concórdia/Oeste','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('NDTV Meio-Oeste','@ndtvmeiooeste','Meio-Oeste','TV regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Rádio Caçanjurê','@radiocacanjure','Caçador/Meio-Oeste','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Rádio 92 FM Caçador','@radio92fmcacador','Caçador/Meio-Oeste','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Rádio Videira','@radiovideira','Videira/Meio-Oeste','Rádio regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Notícia Hoje','@noticiahoje','Caçador/Meio-Oeste','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Caçador Online','@cacadoronline','Caçador/Meio-Oeste','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.'),
('Portal RBV','@portalrbv','Meio-Oeste','Portal regional',null,null,3,'Cadastro regional v13.4 para radar de concorrência e fonte social.')
on conflict (instagram_handle) do update set
  name = excluded.name,
  region = excluded.region,
  category = excluded.category,
  priority = greatest(competitors.priority, excluded.priority),
  notes = excluded.notes;

-- Evita duplicar consultas se o arquivo for rodado mais de uma vez.
delete from rss_queries where label like 'V13.4 Fonte%';

insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('V13.4 Fonte Blumenau Vale','(site:ndmais.com.br OR site:nsctotal.com.br OR site:omunicipio.com.br OR site:olhardovale.com.br) Blumenau OR Brusque OR Vale do Itajaí OR Santa Catarina','Radar Regional','Blumenau','Vale do Itajaí',5,true),
('V13.4 Fonte Brusque','(site:omunicipio.com.br OR site:olhardovale.com.br OR site:ndmais.com.br) Brusque OR Guabiruba OR Botuverá OR Vale do Itajaí','Radar Local','Brusque','Vale do Itajaí',5,true),
('V13.4 Fonte Chapecó Oeste','(site:clicrdc.com.br OR site:diariodoiguacu.com.br OR site:ndmais.com.br OR site:oestemais.com OR site:clickxaxim.com.br) Chapecó OR Xaxim OR Xanxerê OR Oeste Santa Catarina','Radar Oeste','Chapecó','Oeste',5,true),
('V13.4 Fonte Criciúma Sul','(site:engeplus.com.br OR site:4oito.com.br OR site:portallitoralsul.com.br OR site:ndmais.com.br) Criciúma OR Içara OR Tubarão OR Sul catarinense','Radar Sul','Criciúma','Sul',5,true),
('V13.4 Fonte Florianópolis','(site:nsctotal.com.br OR site:ndmais.com.br OR site:scc10.com.br OR site:imagemdailha.com.br) Florianópolis OR Floripa OR São José OR Palhoça OR Grande Florianópolis','Radar Grande Florianópolis','Florianópolis','Grande Florianópolis',5,true),
('V13.4 Fonte Itajaí Litoral','(site:diarinho.net OR site:itajaidigital.com.br OR site:ndmais.com.br) Itajaí OR Balneário Camboriú OR Navegantes OR Camboriú OR Litoral Norte','Radar Litoral Norte','Itajaí','Litoral Norte',5,true),
('V13.4 Fonte Joinville Norte','(site:nsctotal.com.br OR site:ndmais.com.br) Joinville OR São Francisco do Sul OR Araquari OR Norte catarinense','Radar Norte','Joinville','Norte',4,true),
('V13.4 Fonte Alto Vale','Rio do Sul OR Alto Vale OR Amanda FM OR Rádio Mirador OR Unidavi FM OR Massa FM Rio do Sul OR Vale Notícias Santa Catarina','Radar Alto Vale','Rio do Sul','Alto Vale',4,true),
('V13.4 Fonte Tubarão Sul','(site:notisul.com.br OR site:hcnoticias.com.br OR site:diariodosul.com.br) Tubarão OR Laguna OR Capivari de Baixo OR Sul Santa Catarina','Radar Sul','Tubarão','Sul',5,true),
('V13.4 Fonte Lages Serra','(site:noticianoato.com.br OR site:correiolageano.com.br OR site:lagesonline.com.br OR site:ndmais.com.br) Lages OR Serra catarinense OR São Joaquim OR Correia Pinto','Radar Serra','Lages','Serra',5,true),
('V13.4 Fonte Concórdia Oeste','(site:odiario.net OR site:portalconcordia.com.br OR site:ndmais.com.br) Concórdia OR Seara OR Arabutã OR Oeste Santa Catarina','Radar Oeste','Concórdia','Oeste',4,true),
('V13.4 Fonte Caçador Meio Oeste','(site:noticiahoje.com.br OR site:cacadoronline.com.br OR site:portalrbv.com.br OR site:ndmais.com.br) Caçador OR Videira OR Fraiburgo OR Meio-Oeste Santa Catarina','Radar Meio-Oeste','Caçador','Meio-Oeste',4,true),
('V13.4 Fonte SC TV Radio','NSC TV OR NDTV OR SCC SBT OR Record News SC OR Jovem Pan Floripa OR CBN Floripa OR Santa Catarina','TV/Rádio',null,'SC',4,true);

-- Como há mais fontes, o código v13.4 aumenta o limite de consultas carregadas pelo coletor para 140.


-- ===== v13.5 social watch =====
-- Radar SC v13.5 — Busca social assistida e fontes comunitárias
-- Cadastro de perfis de Instagram, páginas e grupos de Facebook informados pelo usuário.
-- Importante: o Radar NÃO faz scraping de Instagram/Facebook e não acessa grupos privados.
-- As redes entram como fontes de monitoramento, concorrência e busca assistida por links públicos/indexados.

insert into source_profiles (name, domain, instagram_handle, region, category, source_type, priority_weight, is_competitor, notes) values
('Blog do Jaime','instagram.com/blogdojaime_blumenau','@blogdojaime_blumenau','Blumenau/Vale do Itajaí','Blog local/social','social',4,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Blumenau Mil Grau','instagram.com/blumilgrau','@blumilgrau','Blumenau/Vale do Itajaí','Página comunitária/humor/notícias','social',3,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Mesorregional','instagram.com/mesorregional','@mesorregional','Blumenau/Vale do Itajaí','Página regional/notícias','social',4,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Cristian Mohr','instagram.com/cristianmohr','@cristianmohr','Blumenau/Vale do Itajaí','Perfil público/local','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Brusque Mil Grau','instagram.com/bqmilgrau','@bqmilgrau','Brusque/Vale do Itajaí','Página comunitária/humor/notícias','social',3,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Brusque Zoeira','instagram.com/brusque_zoeira','@brusque_zoeira','Brusque/Vale do Itajaí','Página comunitária/humor','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Brusque Notícias','instagram.com/brusquenoticias','@brusquenoticias','Brusque/Vale do Itajaí','Página local/notícias','social',4,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('O Município Brusque','instagram.com/omunicipiobrusque','@omunicipiobrusque','Brusque/Vale do Itajaí','Portal regional/social','social',4,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Danilo Visconti','instagram.com/daniloviscontioficial','@daniloviscontioficial','Brusque/Vale do Itajaí','Perfil público/local','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Cacá Tavares SC','instagram.com/cacatavaressc','@cacatavaressc','Brusque/Vale do Itajaí','Perfil público/local','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Chapecó Online','instagram.com/chapeco.online','@chapeco.online','Chapecó/Oeste','Página local/notícias','social',4,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('De Chapecó','instagram.com/dechapeco','@dechapeco','Chapecó/Oeste','Página local/comunitária','social',3,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Chapecó Mil Grau','instagram.com/chapecomilgrauoficial','@chapecomilgrauoficial','Chapecó/Oeste','Página comunitária/humor/notícias','social',3,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Criciúma Mil Grau','instagram.com/criciumamilgrau_','@criciumamilgrau_','Criciúma/Sul','Página comunitária/humor/notícias','social',3,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Carvoeiro Doente','instagram.com/carvoeirodoente','@carvoeirodoente','Criciúma/Sul','Página comunitária/esporte/cidade','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Criciúma Notícias','instagram.com/criciumanoticias','@criciumanoticias','Criciúma/Sul','Página local/notícias','social',4,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Elida Feltrin','instagram.com/elidafeltrin','@elidafeltrin','Criciúma/Sul','Perfil público/local','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Floripa Mil Grau','instagram.com/floripamilgrau','@floripamilgrau','Grande Florianópolis','Página comunitária/humor/notícias','social',3,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Floripa 24h','instagram.com/floripa24h','@floripa24h','Grande Florianópolis','Página local/notícias','social',4,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Dona Bilica','instagram.com/donabilica','@donabilica','Grande Florianópolis','Página comunitária/humor','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Itajaí Mil Grau','instagram.com/itaja1m1lgr4u','@itaja1m1lgr4u','Itajaí/Litoral Norte','Página comunitária/humor/notícias','social',3,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Itajaí News','instagram.com/itajai.news','@itajai.news','Itajaí/Litoral Norte','Página local/notícias','social',4,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Larissa Vanzuita','instagram.com/larissavanzuita','@larissavanzuita','Itajaí/Litoral Norte','Perfil público/local','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Sandro Garcia','instagram.com/sandrogarciaofc','@sandrogarciaofc','Itajaí/Litoral Norte','Perfil público/local','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Joinville Informações','instagram.com/joinvilleinformacoes','@joinvilleinformacoes','Joinville/Norte','Página local/notícias','social',4,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Joinville Mil Grau','instagram.com/joinville.milgrau','@joinville.milgrau','Joinville/Norte','Página comunitária/humor/notícias','social',3,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Aconteceu em Joinville','instagram.com/aconteceuemjoinville','@aconteceuemjoinville','Joinville/Norte','Página local/ocorrências','social',4,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Joinville Alerta','instagram.com/joinville.alerta','@joinville.alerta','Joinville/Norte','Página local/ocorrências','social',4,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Eeeguaaa','instagram.com/eeeguaaa','@eeeguaaa','Joinville/Norte','Página comunitária/humor','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Larissa D Souza','instagram.com/larissadssouza_','@larissadssouza_','Joinville/Norte','Perfil público/local','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Joinville News','instagram.com/joinvillenewsoficial','@joinvillenewsoficial','Joinville/Norte','Página local/notícias','social',4,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Rio do Sul Mil Grau','instagram.com/riodosulmilgrau','@riodosulmilgrau','Rio do Sul/Alto Vale','Página comunitária/humor/notícias','social',3,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Tubarão Notícias','instagram.com/tubaraonoticias','@tubaraonoticias','Tubarão/Sul','Página local/notícias','social',4,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Francine Vieira','instagram.com/francinevieira','@francinevieira','Tubarão/Sul','Perfil público/local','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Lages Mil Grau','instagram.com/lages_milgrau','@lages_milgrau','Lages/Serra','Página comunitária/humor/notícias','social',3,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Biguá Tá On','instagram.com/biguataon','@biguataon','Lages/Serra','Página local/comunitária','social',3,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Lages Online','instagram.com/lagesonline','@lagesonline','Lages/Serra','Portal/Página local','social',4,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Amo Lages','instagram.com/amolages','@amolages','Lages/Serra','Página comunitária/cidade','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Viver Lages','instagram.com/viverlages','@viverlages','Lages/Serra','Página comunitária/cidade','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Calebe Costa','instagram.com/calebecostaa','@calebecostaa','Lages/Serra','Perfil público/local','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Concórdia no Grau','instagram.com/concordianograu.oficial','@concordianograu.oficial','Concórdia/Oeste','Página comunitária/humor/notícias','social',3,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Concórdia News','instagram.com/concordianews.sc','@concordianews.sc','Concórdia/Oeste','Página local/notícias','social',4,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Viver Concórdia','instagram.com/viverconcordia','@viverconcordia','Concórdia/Oeste','Página comunitária/cidade','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Amo Concórdia','instagram.com/amoconcordia','@amoconcordia','Concórdia/Oeste','Página comunitária/cidade','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Cadu de Concórdia','instagram.com/cadudeconcordia','@cadudeconcordia','Concórdia/Oeste','Perfil público/local','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Caçador Mil Graus','instagram.com/cacador_milgraus','@cacador_milgraus','Caçador/Meio-Oeste','Página comunitária/humor/notícias','social',3,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Caçador Urgente','instagram.com/cacadorurgente','@cacadorurgente','Caçador/Meio-Oeste','Página local/ocorrências','social',4,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Viver Caçador','instagram.com/vivercacador','@vivercacador','Caçador/Meio-Oeste','Página comunitária/cidade','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Amo Caçador','instagram.com/amocacador','@amocacador','Caçador/Meio-Oeste','Página comunitária/cidade','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Gabriel Malheiro','instagram.com/gabrielmalheiroof','@gabrielmalheiroof','Caçador/Meio-Oeste','Perfil público/local','social',2,true,'Perfil social cadastrado para monitoramento editorial manual; não faz scraping automático.'),
('Cristian Mohr Facebook','facebook.com/cristianmohr03',null,'Blumenau/Vale do Itajaí','Página Facebook/local','facebook_page',2,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Cacá do Berro Facebook','facebook.com/cacadoberro',null,'Brusque/Vale do Itajaí','Página Facebook/local','facebook_page',2,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Floripa 24h Facebook','facebook.com/Florianopolis24h',null,'Grande Florianópolis','Página Facebook/notícias','facebook_page',3,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Mesorregional Facebook','facebook.com/Mesorregional',null,'Blumenau/Vale do Itajaí','Página Facebook/notícias/trânsito','facebook_page',3,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Brusque Mil Grau Facebook','facebook.com/bqmilgrau',null,'Brusque/Vale do Itajaí','Página Facebook/humor/notícias','facebook_page',3,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('O Município Brusque Facebook','facebook.com/omunicipiobrusque',null,'Brusque/Vale do Itajaí','Página Facebook/notícias','facebook_page',3,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Portal Engeplus Facebook','facebook.com/portalengeplus',null,'Criciúma/Sul','Página Facebook/notícias','facebook_page',3,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Floripa Mil Grau Grupo','facebook.com/groups/floripamilgraugrupo',null,'Grande Florianópolis','Grupo Facebook/humor/notícias','facebook_group',2,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Vale do Itajaí Notícias Grupo','facebook.com/groups/1695750343936044',null,'Itajaí/Litoral Norte','Grupo Facebook/notícias','facebook_group',2,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('DIARINHO Facebook','facebook.com/jornaldiarinho',null,'Itajaí/Litoral Norte','Página Facebook/notícias','facebook_page',3,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Joinville Informações Grupo','facebook.com/groups/850943675296626',null,'Joinville/Norte','Grupo Facebook/notícias/utilidade','facebook_group',2,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Aconteceu em Joinville Grupo','facebook.com/groups/aconteceuemjoinville',null,'Joinville/Norte','Grupo Facebook/ocorrências','facebook_group',2,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Ponto Norte Joinville Grupo','facebook.com/groups/omunicipiojoinville',null,'Joinville/Norte','Grupo Facebook/notícias','facebook_group',2,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Joinville de Sempre Grupo','facebook.com/groups/joinvilledeontemjjojedesempre',null,'Joinville/Norte','Grupo Facebook/memória/cultura','facebook_group',1,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Rádio Amanda FM Facebook','facebook.com/radioamandafm',null,'Rio do Sul/Alto Vale','Página Facebook/notícias','facebook_page',3,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Rádio Mirador Facebook','facebook.com/Mirador98.5fm',null,'Rio do Sul/Alto Vale','Página Facebook/notícias/debate','facebook_page',3,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Notisul Facebook','facebook.com/notisul',null,'Tubarão/Sul','Página Facebook/notícias','facebook_page',3,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Rádio Tubá Facebook','facebook.com/radiotubatb',null,'Tubarão/Sul','Página Facebook/notícias/debate','facebook_page',3,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Lages Mil Grau Grupo','facebook.com/groups/lagesmilgrau',null,'Lages/Serra','Grupo Facebook/humor/notícias','facebook_group',2,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Lages é a minha paixão Grupo','facebook.com/groups/381175958582755',null,'Lages/Serra','Grupo Facebook/comunitário/memória','facebook_group',1,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Lages - A Capital das Aldeias Grupo','facebook.com/groups/557086807701611',null,'Lages/Serra','Grupo Facebook/notícias/interação','facebook_group',2,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Doação Lages Grupo','facebook.com/groups/doacaolages',null,'Lages/Serra','Grupo Facebook/solidariedade','facebook_group',1,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Brechó Não é da Vovó Lages Grupo','facebook.com/groups/brecholages',null,'Lages/Serra','Grupo Facebook/vendas/comunidade','facebook_group',1,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Bairro Guarujá Lages Grupo','facebook.com/groups/1574033596226283',null,'Lages/Serra','Grupo Facebook/bairro','facebook_group',1,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Moradores do Bairro Coral Grupo','facebook.com/groups/bairrocora',null,'Lages/Serra','Grupo Facebook/bairro','facebook_group',1,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Bairro Habitação Lages Grupo','facebook.com/groups/bairrohabitacao',null,'Lages/Serra','Grupo Facebook/bairro','facebook_group',1,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Moradores de Concórdia 2.0 Grupo','facebook.com/groups/658790629015157',null,'Concórdia/Oeste','Grupo Facebook/comunitário','facebook_group',1,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Concórdia Mil Grau Grupo','facebook.com/groups/concordiamilgrau',null,'Concórdia/Oeste','Grupo Facebook/humor/notícias','facebook_group',2,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Atual FM Facebook','facebook.com/atualfm',null,'Concórdia/Oeste','Página Facebook/notícias','facebook_page',3,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Rádio Rural Facebook','facebook.com/radioruralfm93.7',null,'Concórdia/Oeste','Página Facebook/notícias/agro','facebook_page',3,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Moradores Bairro Nações Concórdia Grupo','facebook.com/groups/bairronacoesconcordia',null,'Concórdia/Oeste','Grupo Facebook/bairro','facebook_group',1,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Bairro Guilherme Reich Grupo','facebook.com/groups/guilhermereich',null,'Concórdia/Oeste','Grupo Facebook/bairro','facebook_group',1,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Moradores do Bairro Imperial Grupo','facebook.com/groups/bairroimperial',null,'Concórdia/Oeste','Grupo Facebook/bairro','facebook_group',1,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Moradores de Caçador SC Grupo','facebook.com/groups/488859477800360',null,'Caçador/Meio-Oeste','Grupo Facebook/comunitário','facebook_group',1,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Caçador Antigamente Grupo','facebook.com/groups/AntigoCacador',null,'Caçador/Meio-Oeste','Grupo Facebook/memória/cultura','facebook_group',1,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Caçador Mil Grau Grupo','facebook.com/groups/61577915532060',null,'Caçador/Meio-Oeste','Grupo Facebook/humor/notícias','facebook_group',2,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Portal Notícia Hoje Facebook','facebook.com/noticiahoje',null,'Caçador/Meio-Oeste','Página Facebook/notícias','facebook_page',3,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Bairro Martello Caçador Grupo','facebook.com/groups/bairromartello',null,'Caçador/Meio-Oeste','Grupo Facebook/bairro','facebook_group',1,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Moradores do Bairro Berger Grupo','facebook.com/groups/bairroberger',null,'Caçador/Meio-Oeste','Grupo Facebook/bairro','facebook_group',1,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.'),
('Amigos do Bairro Mutirão Grupo','facebook.com/groups/bairromutirao',null,'Caçador/Meio-Oeste','Grupo Facebook/bairro','facebook_group',1,true,'Fonte pública/comunitária cadastrada para busca assistida; o Radar não faz scraping nem acessa conteúdo privado.')
on conflict (domain) do update set
  name = excluded.name,
  instagram_handle = excluded.instagram_handle,
  region = excluded.region,
  category = excluded.category,
  source_type = excluded.source_type,
  priority_weight = greatest(source_profiles.priority_weight, excluded.priority_weight),
  is_competitor = excluded.is_competitor,
  notes = excluded.notes;

insert into competitors (name, instagram_handle, region, category, followers_estimate, contact_commercial, priority, notes) values
('Blog do Jaime','@blogdojaime_blumenau','Blumenau/Vale do Itajaí','Blog local/social',null,null,4,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Blumenau Mil Grau','@blumilgrau','Blumenau/Vale do Itajaí','Página comunitária/humor/notícias',null,null,3,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Mesorregional','@mesorregional','Blumenau/Vale do Itajaí','Página regional/notícias',null,null,4,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Cristian Mohr','@cristianmohr','Blumenau/Vale do Itajaí','Perfil público/local',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Brusque Mil Grau','@bqmilgrau','Brusque/Vale do Itajaí','Página comunitária/humor/notícias',null,null,3,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Brusque Zoeira','@brusque_zoeira','Brusque/Vale do Itajaí','Página comunitária/humor',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Brusque Notícias','@brusquenoticias','Brusque/Vale do Itajaí','Página local/notícias',null,null,4,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('O Município Brusque','@omunicipiobrusque','Brusque/Vale do Itajaí','Portal regional/social',null,null,4,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Danilo Visconti','@daniloviscontioficial','Brusque/Vale do Itajaí','Perfil público/local',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Cacá Tavares SC','@cacatavaressc','Brusque/Vale do Itajaí','Perfil público/local',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Chapecó Online','@chapeco.online','Chapecó/Oeste','Página local/notícias',null,null,4,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('De Chapecó','@dechapeco','Chapecó/Oeste','Página local/comunitária',null,null,3,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Chapecó Mil Grau','@chapecomilgrauoficial','Chapecó/Oeste','Página comunitária/humor/notícias',null,null,3,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Criciúma Mil Grau','@criciumamilgrau_','Criciúma/Sul','Página comunitária/humor/notícias',null,null,3,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Carvoeiro Doente','@carvoeirodoente','Criciúma/Sul','Página comunitária/esporte/cidade',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Criciúma Notícias','@criciumanoticias','Criciúma/Sul','Página local/notícias',null,null,4,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Elida Feltrin','@elidafeltrin','Criciúma/Sul','Perfil público/local',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Floripa Mil Grau','@floripamilgrau','Grande Florianópolis','Página comunitária/humor/notícias',null,null,3,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Floripa 24h','@floripa24h','Grande Florianópolis','Página local/notícias',null,null,4,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Dona Bilica','@donabilica','Grande Florianópolis','Página comunitária/humor',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Itajaí Mil Grau','@itaja1m1lgr4u','Itajaí/Litoral Norte','Página comunitária/humor/notícias',null,null,3,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Itajaí News','@itajai.news','Itajaí/Litoral Norte','Página local/notícias',null,null,4,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Larissa Vanzuita','@larissavanzuita','Itajaí/Litoral Norte','Perfil público/local',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Sandro Garcia','@sandrogarciaofc','Itajaí/Litoral Norte','Perfil público/local',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Joinville Informações','@joinvilleinformacoes','Joinville/Norte','Página local/notícias',null,null,4,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Joinville Mil Grau','@joinville.milgrau','Joinville/Norte','Página comunitária/humor/notícias',null,null,3,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Aconteceu em Joinville','@aconteceuemjoinville','Joinville/Norte','Página local/ocorrências',null,null,4,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Joinville Alerta','@joinville.alerta','Joinville/Norte','Página local/ocorrências',null,null,4,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Eeeguaaa','@eeeguaaa','Joinville/Norte','Página comunitária/humor',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Larissa D Souza','@larissadssouza_','Joinville/Norte','Perfil público/local',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Joinville News','@joinvillenewsoficial','Joinville/Norte','Página local/notícias',null,null,4,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Rio do Sul Mil Grau','@riodosulmilgrau','Rio do Sul/Alto Vale','Página comunitária/humor/notícias',null,null,3,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Tubarão Notícias','@tubaraonoticias','Tubarão/Sul','Página local/notícias',null,null,4,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Francine Vieira','@francinevieira','Tubarão/Sul','Perfil público/local',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Lages Mil Grau','@lages_milgrau','Lages/Serra','Página comunitária/humor/notícias',null,null,3,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Biguá Tá On','@biguataon','Lages/Serra','Página local/comunitária',null,null,3,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Lages Online','@lagesonline','Lages/Serra','Portal/Página local',null,null,4,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Amo Lages','@amolages','Lages/Serra','Página comunitária/cidade',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Viver Lages','@viverlages','Lages/Serra','Página comunitária/cidade',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Calebe Costa','@calebecostaa','Lages/Serra','Perfil público/local',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Concórdia no Grau','@concordianograu.oficial','Concórdia/Oeste','Página comunitária/humor/notícias',null,null,3,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Concórdia News','@concordianews.sc','Concórdia/Oeste','Página local/notícias',null,null,4,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Viver Concórdia','@viverconcordia','Concórdia/Oeste','Página comunitária/cidade',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Amo Concórdia','@amoconcordia','Concórdia/Oeste','Página comunitária/cidade',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Cadu de Concórdia','@cadudeconcordia','Concórdia/Oeste','Perfil público/local',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Caçador Mil Graus','@cacador_milgraus','Caçador/Meio-Oeste','Página comunitária/humor/notícias',null,null,3,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Caçador Urgente','@cacadorurgente','Caçador/Meio-Oeste','Página local/ocorrências',null,null,4,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Viver Caçador','@vivercacador','Caçador/Meio-Oeste','Página comunitária/cidade',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Amo Caçador','@amocacador','Caçador/Meio-Oeste','Página comunitária/cidade',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.'),
('Gabriel Malheiro','@gabrielmalheiroof','Caçador/Meio-Oeste','Perfil público/local',null,null,2,'Cadastro social v13.5 para radar de sinais em Instagram/Facebook. Não faz scraping automático.')
on conflict (instagram_handle) do update set
  name = excluded.name,
  region = excluded.region,
  category = excluded.category,
  priority = greatest(competitors.priority, excluded.priority),
  notes = excluded.notes;

-- Consultas de apoio: tentam captar repercussão pública citando essas fontes e cidades.
-- A busca automática principal continua vindo do Google News; Instagram/Facebook ficam como busca assistida na tela /social.
delete from rss_queries where label like 'V13.5 Social%';

insert into rss_queries (label, query, topic, city, region, priority_weight, enabled) values
('V13.5 Social Blumenau','"Blog do Jaime" OR "Blumenau Mil Grau" OR Mesorregional OR "Informe Blumenau" OR "Cristian Mohr" Blumenau "Santa Catarina"','Sinais sociais','Blumenau','Vale do Itajaí',4,true),
('V13.5 Social Brusque','"Brusque Mil Grau" OR "Brusque Notícias" OR "O Município Brusque" OR "Cacá Tavares" OR "Danilo Visconti" Brusque "Santa Catarina"','Sinais sociais','Brusque','Vale do Itajaí',4,true),
('V13.5 Social Chapecó','"Chapecó Online" OR "De Chapecó" OR "Chapecó Mil Grau" OR ClicRDC Chapecó "Santa Catarina"','Sinais sociais','Chapecó','Oeste',4,true),
('V13.5 Social Criciúma','"Criciúma Mil Grau" OR "Criciúma Notícias" OR "Portal Engeplus" OR "Carvoeiro Doente" Criciúma "Santa Catarina"','Sinais sociais','Criciúma','Sul',4,true),
('V13.5 Social Florianópolis','"Floripa Mil Grau" OR "Floripa 24h" OR "Dona Bilica" Florianópolis OR Floripa "Santa Catarina"','Sinais sociais','Florianópolis','Grande Florianópolis',4,true),
('V13.5 Social Itajaí','"Itajaí Mil Grau" OR "Itajaí News" OR DIARINHO OR "Vale do Itajaí Notícias" Itajaí "Santa Catarina"','Sinais sociais','Itajaí','Litoral Norte',4,true),
('V13.5 Social Joinville','"Joinville Informações" OR "Aconteceu em Joinville" OR "Joinville Alerta" OR "Joinville News" Joinville "Santa Catarina"','Sinais sociais','Joinville','Norte',4,true),
('V13.5 Social Rio do Sul','"Rio do Sul Mil Grau" OR "Rádio Amanda" OR "Rádio Mirador" OR "Alto Vale" "Santa Catarina"','Sinais sociais','Rio do Sul','Alto Vale',3,true),
('V13.5 Social Tubarão','"Tubarão Notícias" OR Notisul OR "Rádio Tubá" OR "Francine Vieira" Tubarão "Santa Catarina"','Sinais sociais','Tubarão','Sul',4,true),
('V13.5 Social Lages','"Lages Mil Grau" OR "Amo Lages" OR "Viver Lages" OR "Lages Online" Lages "Santa Catarina"','Sinais sociais','Lages','Serra',4,true),
('V13.5 Social Concórdia','"Concórdia no Grau" OR "Concórdia News" OR "Viver Concórdia" OR "Amo Concórdia" Concórdia "Santa Catarina"','Sinais sociais','Concórdia','Oeste',4,true),
('V13.5 Social Caçador','"Caçador Mil Grau" OR "Caçador Urgente" OR "Viver Caçador" OR "Amo Caçador" Caçador "Santa Catarina"','Sinais sociais','Caçador','Meio-Oeste',4,true);
