-- Radar SC v13 — Redação Enxuta
-- Adiciona suporte mais claro para a fila "Enviar para pauta".

alter table if exists editorial_tasks
  add column if not exists notes text;

alter table if exists editorial_tasks
  add column if not exists priority integer not null default 0;

create index if not exists idx_editorial_tasks_type_status_created
  on editorial_tasks(task_type, status, created_at desc);

create index if not exists idx_editorial_tasks_news_status
  on editorial_tasks(news_item_id, status);

-- Ajusta tarefas antigas, se existirem.
update editorial_tasks
set task_type = 'pauta_editorial'
where task_type in ('pauta', 'produção', 'producao', 'site', 'instagram')
  and task_type <> 'pauta_editorial';
