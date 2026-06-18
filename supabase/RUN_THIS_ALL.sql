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




-- =========================
-- v8 city focus
-- =========================
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
