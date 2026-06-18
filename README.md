# Radar SC — O Catarina v7

Painel editorial para monitorar **notícias do dia**, agrupar pautas repetidas, analisar concorrência e decidir o que publicar primeiro no portal **O Catarina**.

## Principais recursos v7

- Notícias recentes por janela: 6h, 12h, 24h e 36h.
- Agrupamento de matérias parecidas em uma pauta única.
- Aba **Pautas**: mostra eventos únicos, não links duplicados.
- Score de prioridade com 4 sinais:
  - oportunidade editorial;
  - urgência;
  - concorrência/repercussão;
  - risco jurídico/editorial.
- Detecção de **vácuo editorial**: pauta quente com pouca saturação.
- Aba **Concorrência** reestruturada por pauta agrupada.
- Botão de base editorial: título, linha de apoio, corpo-base, legenda e roteiro curto.
- Exportação CSV de notícias e de pautas agrupadas.

## Instalação

### 1. Supabase

No SQL Editor, rode os arquivos nesta ordem:

1. `supabase/schema.sql`
2. `supabase/v5_competition.sql`
3. `supabase/v6_recent_only.sql`
4. `supabase/v7_editorial.sql`

Ou rode o arquivo único:

```txt
supabase/RUN_THIS_ALL.sql
```

Atenção: no Supabase cole o **conteúdo** do arquivo SQL, não o nome do arquivo.

### 2. Variáveis de ambiente na Vercel

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
RADAR_PASSWORD=sua_senha_opcional
CRON_SECRET=seu_token_secreto
RADAR_RECENT_HOURS=24
```

`RADAR_PASSWORD` é opcional. Se remover, o painel abre sem Basic Auth. `CRON_SECRET` protege coleta e exportações.

### 3. Deploy

Suba todos os arquivos na raiz do repositório:

```txt
app/
components/
lib/
supabase/
package.json
postcss.config.js
tailwind.config.ts
vercel.json
README.md
```

Faça commit novo. A Vercel precisa buildar o commit novo, não um deploy antigo.

## Uso

### Coleta manual

```txt
/api/cron/collect-news?secret=SEU_CRON_SECRET
```

### Exportar notícias

```txt
/api/export/news.csv?secret=SEU_CRON_SECRET
```

### Exportar pautas agrupadas

```txt
/api/export/stories.csv?secret=SEU_CRON_SECRET
```

### Páginas principais

- `/` — dashboard “o que publicar agora”
- `/stories` — pautas agrupadas por evento
- `/news` — links individuais
- `/competitors` — concorrência/repercussão
- `/draft?newsId=ID_DA_NOTICIA` — base editorial para reapuração

## Observação editorial

O Radar serve para descobrir pauta, comparar concorrência e acelerar produção. Ele **não deve copiar matéria** de terceiros. Fluxo correto:

1. abrir fonte inicial;
2. checar fonte oficial;
3. confirmar local, data, nomes e status;
4. escrever com título, linha de apoio e ângulo próprios;
5. citar fonte quando necessário.

A métrica de concorrência é proxy editorial via RSS/Google News. Likes, comentários e salvamentos exigem API/relatório oficial da Meta.
