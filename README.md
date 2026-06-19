# Radar SC — O Catarina v13

Versão de redação enxuta: Clipping encontra, Produção separa o que será publicado, Instagram organiza redes e Concorrência acompanha disputa.

## Lógica das telas

- `/` — início simplificado
- `/clipping` — resumo executivo do dia e botão **Enviar para pauta**
- `/radar` — busca ativa por cidade, tema, rodovia ou frase específica
- `/production` — fila das pautas escolhidas para publicar
- `/instagram` — oportunidades para Reels, Feed e Stories
- `/stories` — agrupamento técnico por pauta/evento
- `/competitors` — análise de concorrentes
- `/admin/news` — base bruta de notícias capturadas

## Atualização no Supabase

Se já rodou os SQLs anteriores, rode apenas:

```txt
supabase/v13_redacao_enxuta.sql
```

Em instalação limpa, rode:

```txt
supabase/RUN_THIS_ALL.sql
```

## Fluxo recomendado

1. Abra o **Clipping**.
2. Clique em **Enviar para pauta** nas notícias que quer publicar.
3. Vá em **Produção**.
4. Gere base, marque como em produção, publicada, reapurar ou descartar.
5. Use **Instagram** para adaptar as pautas para redes.

## Importante para deploy

Não suba `package-lock.json` gerado fora do GitHub/Vercel. Se ele apontar para registry interno, a Vercel pode falhar no `npm install`.

## v13.1 — Fonte adicionada

Fonte regional adicionada ao Radar:

- Donna da Notícia — donnadanoticia.com.br

Rode no Supabase:

```txt
supabase/v13_1_donna_da_noticia.sql
```

Depois execute uma nova coleta pelo botão **Atualizar agora**.
