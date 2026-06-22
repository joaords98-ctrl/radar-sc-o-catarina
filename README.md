# Radar SC — O Catarina v13.5

Versão de redação enxuta com **Clipping**, **Busca**, **Produção**, **Instagram** e **Concorrência**.

## Rotas principais

- `/` — início simplificado
- `/clipping` — clipping do dia
- `/radar` — busca ativa por cidade/tema/rodovia
- `/production` — fila de pautas escolhidas para publicação
- `/instagram` — fila Instagram
- `/stories` — pautas agrupadas
- `/admin/news` — notícias brutas
- `/competitors` — concorrência

## Novidade v13.2

Adicionados portais estratégicos ao Radar:

- NSC Total
- G1 Santa Catarina
- Diarinho
- Imagem da Ilha
- CNN Brasil / Santa Catarina
- SCC10
- Santa Catarina em Pauta
- GZH / Santa Catarina
- Folha / Santa Catarina
- RCN Online
- UOL Santa Catarina
- Correio SC
- Gazeta SBS
- SC Portais
- Tudo Aqui SC
- Blog do Prisco
- Donna da Notícia

## Atualização Supabase

Se você já rodou os SQLs anteriores, rode apenas:

```txt
supabase/v13_2_portais_estrategicos.sql
```

Para instalação limpa, rode:

```txt
supabase/RUN_THIS_ALL.sql
```

## Atenção Vercel

Este pacote **não inclui package-lock.json** para evitar registry interno no deploy.

Depois do deploy, confira se aparecem as rotas:

```txt
/clipping
/production
/instagram
/admin/news
```


## v13.3 — Portais Oeste/Regionais

Adicionados ao Radar:

- Oeste Mais — `oestemais.com`
- Click Xaxim — `clickxaxim.com.br`
- Nova FM 103 — `novafm103.com.br`
- DI Regional — `diregional.com.br`
- ClicRDC — `clicrdc.com.br`
- Agência ICEM — `agenciaicem.com.br`

Rode `supabase/v13_3_portais_oeste_regionais.sql` no Supabase depois do deploy.


## v13.4 — Fontes regionais e redes por praça

Adicionado cadastro ampliado de veículos por praça: Blumenau/Vale, Brusque, Chapecó/Oeste, Criciúma/Sul, Grande Florianópolis, Itajaí/Litoral, Joinville/Norte, Alto Vale, Tubarão, Lages/Serra, Concórdia/Oeste e Caçador/Meio-Oeste.

Também foi criado o arquivo:

```txt
supabase/v13_4_fontes_regionais_redes.sql
```

Rode esse SQL depois do deploy para cadastrar as novas fontes. Perfis de Instagram/Facebook ficam como fontes sociais/concorrentes para monitoramento manual; o Radar não faz scraping automático de redes sociais.

O coletor passou a carregar até 140 consultas ativas para comportar a base ampliada.


## v13.5 — Busca social assistida

Adiciona `/social` para organizar perfis de Instagram, páginas e grupos de Facebook por região.

O Radar não faz scraping de Instagram/Facebook. A tela cria links de busca pública/indexada para checar sinais de notícia, vídeos, trânsito e denúncias.

SQL novo: `supabase/v13_5_social_watch.sql`.
