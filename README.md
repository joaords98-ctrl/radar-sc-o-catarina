# Radar SC — O Catarina v10

Painel editorial para encontrar notícias recentes de Santa Catarina, filtrar por cidade/região/tema, analisar concorrência, priorizar pautas e gerar base de texto para site e Instagram.

## Novidades da v10

- Nova página **Instagram Intelligence** em `/instagram`.
- Ordenação por preferência editorial:
  - **Maior potencial**
  - **Mais recente**
  - **Mais urgente**
  - **Concorrência forte**
  - **Potencial Instagram**
- Filtros combinados por **cidade**, **região**, **tema**, **janela de tempo** e **formato**.
- Fila específica para Instagram com sugestão de:
  - Reels
  - Feed
  - Stories
  - Carrossel
  - Monitorar/apurar
- Score de **Potencial Instagram** para cada notícia.
- Cards de pauta agora mostram também a força para Instagram.
- Gerador de base editorial usa padrão do O Catarina:
  - site com destaques em `**negrito**`;
  - Instagram sem `**` e com até 5 hashtags.
- Reforço de buscas para pautas visuais: vídeo, flagrante, rodovia, acidente, cidade e utilidade pública.

## Como atualizar

1. Suba os arquivos deste projeto no GitHub.
2. Faça commit, por exemplo:

```txt
Update v10 Instagram Intelligence e filtros
```

3. Na Vercel, aguarde o deploy automático.
4. No Supabase, rode o conteúdo de:

```txt
supabase/v10_instagram_intelligence.sql
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
/stories       Pautas agrupadas com filtros e ordenação
/instagram     Fila Instagram / Reels / Feed / Stories
/radar         Busca ativa por cidade/tema/termo
/news          Notícias brutas com filtros e ordenação
/competitors   Concorrência
/draft?newsId= ID da notícia para gerar base editorial
```

## Exemplos de uso

Ver pautas de Itajaí por maior potencial:

```txt
/stories?hours=24&city=Itajaí&sort=potencial
```

Ver notícias mais recentes de Joinville:

```txt
/news?hours=12&city=Joinville&sort=recente
```

Ver oportunidades de Reels:

```txt
/instagram?hours=24&format=reels&sort=instagram
```

Ver pautas com concorrência forte:

```txt
/stories?hours=24&sort=concorrencia
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

## Observação importante

A métrica de Instagram da v10 é uma estimativa editorial baseada em recência, vídeo/imagem, cidade, concorrência, repercussão e risco. Ela **não** mede curtidas, comentários, salvamentos ou alcance real dos concorrentes. Para isso, o caminho correto é importar relatório do Meta Business Suite ou usar API oficial da Meta.
