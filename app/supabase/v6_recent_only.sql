-- Radar SC v6 — Notícias do dia / janela recente
-- Rode depois da v5. O código passa a filtrar por RADAR_RECENT_HOURS, padrão 24h.

create index if not exists idx_news_recent_published on news_items(published_at desc) where published_at is not null;

-- Opcional: se quiser limpar visualmente notícias antigas já importadas como novas,
-- descomente a linha abaixo. Recomendo manter comentado para preservar histórico.
-- update news_items set status = 'descartado' where published_at < now() - interval '7 days' and status = 'novo';

-- As consultas antigas continuam válidas. O código adiciona automaticamente when:1d no Google News
-- e ignora qualquer item com published_at fora da janela recente.
