# Radar SC — O Catarina v11

Painel editorial para monitorar notícias de Santa Catarina, concorrência, Instagram e clipping do dia.

## Versão v11 — Clipping inteligente

Novidades principais:

- nova aba `/clipping`;
- resumo copiável do clipping do dia;
- filtros por janela, cidade, região, tema, ordem e modo;
- modos: geral, ainda não publicadas, com fonte oficial e urgentes;
- ranking de cidades, temas e fontes mais ativas;
- destaque para quem publicou primeiro;
- detector de fonte oficial;
- painel das pautas que o O Catarina ainda não publicou;
- exportação CSV do clipping em `/api/export/clipping.csv`;
- mantém abas anteriores: Dashboard, Pautas, Busca Ativa, Instagram, Notícias e Concorrência.

## Rotas principais

- `/` — Dashboard geral
- `/clipping` — Clipping inteligente do dia
- `/stories` — Pautas agrupadas
- `/radar` — Busca ativa por cidade/tema
- `/instagram` — Fila de oportunidades para Instagram
- `/news` — Notícias individuais
- `/competitors` — Concorrência
- `/draft?newsId=ID` — Gerar base editorial

## Exemplos de filtros

Mais recentes:

```txt
/clipping?hours=24&sort=recente
```

Maior potencial:

```txt
/clipping?hours=24&sort=potencial
```

Ainda não publicadas:

```txt
/clipping?hours=24&mode=pendentes
```

Com fonte oficial:

```txt
/clipping?hours=24&mode=oficiais
```

Por cidade:

```txt
/clipping?hours=24&city=Itajaí
```

Por região:

```txt
/clipping?hours=24&region=Oeste
```

Exportar CSV:

```txt
/api/export/clipping.csv?hours=24&sort=potencial
```

## Atualização no Supabase

Se você já rodou os SQLs anteriores, rode apenas:

```txt
supabase/v11_clipping_inteligente.sql
```

Para instalação limpa, rode:

```txt
supabase/RUN_THIS_ALL.sql
```

## Variáveis de ambiente na Vercel

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
RADAR_PASSWORD=
RADAR_RECENT_HOURS=24
```

## Deploy

Suba o conteúdo desta pasta para o GitHub e faça commit:

```txt
Update v11 clipping inteligente
```

A Vercel deve fazer o deploy automaticamente.


## v11.1 — ajuste de horário

- Corrige a exibição da Última coleta para o fuso de Brasília (`America/Sao_Paulo`).
- Corrige horários do clipping e da busca ativa que eram renderizados no fuso UTC da Vercel.
- Não exige SQL novo no Supabase.
