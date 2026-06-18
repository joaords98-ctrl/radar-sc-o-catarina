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
