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
