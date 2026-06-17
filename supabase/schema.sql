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
