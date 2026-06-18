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
