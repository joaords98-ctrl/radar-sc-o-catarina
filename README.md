# Radar SC — O Catarina v9

Painel editorial para encontrar notícias recentes de Santa Catarina, mapear concorrência, agrupar pautas e gerar base de texto para o O Catarina.

## Novidades da v9

- Nova página **Busca ativa** em `/radar`.
- Busca manual por termo, cidade, região, tema e janela de tempo.
- Exemplo de uso: `vídeo caminhão tombou SC-155`.
- O resultado é filtrado para Santa Catarina antes de salvar no Supabase.
- Resultados salvos já aparecem nas abas **Pautas**, **Notícias** e **Concorrência**.
- Botão para **copiar consulta** e **copiar resultados**.
- Reforço de consultas para rodovias de SC: SC-155, BR-101, BR-282 e BR-470.
- Mais cidades catarinenses reconhecidas pelo filtro geográfico.

## Como atualizar

1. Suba os arquivos deste projeto no GitHub.
2. Na Vercel, aguarde o deploy automático.
3. No Supabase, rode o conteúdo de:

```txt
supabase/v9_busca_ativa.sql
```

Se for uma instalação limpa, rode:

```txt
supabase/RUN_THIS_ALL.sql
```

## Variáveis de ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
RADAR_RECENT_HOURS=24
RADAR_PASSWORD=
```

`RADAR_PASSWORD` é opcional. Se estiver vazio, o painel fica sem Basic Auth.

## Rotas principais

```txt
/              Dashboard
/stories       Pautas agrupadas
/radar         Busca ativa por cidade/tema/termo
/news          Notícias brutas
/competitors   Concorrência
/draft?newsId= ID da notícia para gerar base editorial
```

## Coleta automática/manual

Coleta via cron:

```txt
/api/cron/collect-news?secret=SEU_CRON_SECRET
```

Coleta pelo painel:

```txt
/api/panel/collect-news
```

Busca ativa pelo painel:

```txt
/api/panel/active-search
```
