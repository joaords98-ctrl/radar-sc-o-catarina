# Radar SC — O Catarina v8.1

Painel de redação para monitorar notícias recentes de Santa Catarina, agrupar pautas, comparar concorrência e decidir o que publicar primeiro.

## O que mudou na v8.1

- Filtro duro para evitar notícias de outros estados.
- Coleta mais equilibrada: não fica presa apenas em segurança pública.
- Novas buscas por cidade, região e tema.
- Atalhos por cidade no dashboard.
- Aba `Pautas` com filtros de cidade, região e tema.
- Detecção de contexto catarinense por cidade, região, rodovia SC/BR e fontes locais.
- Contadores de coleta agora indicam notícias ignoradas por fora de SC ou sem contexto catarinense.
- Botão **Atualizar agora** fixado no cabeçalho para não sumir ao navegar/rolar a tela.
- Página de base editorial com botões **Copiar matéria site**, **Copiar tudo** e **Copiar** por bloco.

## Instalação

Suba os arquivos para o GitHub e aguarde o deploy na Vercel.

Variáveis necessárias na Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
RADAR_RECENT_HOURS=24
RADAR_PASSWORD=
```

`RADAR_PASSWORD` é opcional. Se estiver vazio, o painel fica sem Basic Auth.

## Supabase

Se já rodou as versões anteriores, rode apenas:

```txt
supabase/v8_city_focus.sql
```

Se for instalação nova, rode:

```txt
supabase/RUN_THIS_ALL.sql
```

## Coleta manual

```txt
/api/cron/collect-news?secret=SEU_CRON_SECRET
```

O retorno da v8.1 pode trazer:

```json
{
  "inserted": 40,
  "updated": 10,
  "skippedOld": 200,
  "skippedOutOfState": 12,
  "skippedNoScContext": 31
}
```

`skippedOutOfState` é bom sinal: significa que o sistema está barrando notícias como Ceará, SP, PR etc.

## Páginas principais

- `/` — dashboard geral
- `/stories` — pautas agrupadas
- `/news` — links brutos
- `/competitors` — concorrência
- `/draft?newsId=ID` — base editorial

## Exemplos de filtros

```txt
/stories?hours=24&region=Oeste
/stories?hours=24&city=Joinville
/stories?hours=24&topic=Trânsito%2FRodovias
/news?hours=36&city=Itajaí
```

## Observação editorial

O Radar mede repercussão editorial por fontes/veículos detectados. Ele não mede curtidas, comentários ou salvamentos reais de Instagram sem importação/API oficial da Meta.
