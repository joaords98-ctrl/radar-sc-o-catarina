# Radar SC — O Catarina v13.12.8

Versão de redação enxuta com **Clipping**, **Busca**, **Produção**, **Instagram** e **Concorrência**.

## Rotas principais

- `/` — início simplificado
- `/clipping` — clipping do dia
- `/radar` — busca ativa por cidade/tema/rodovia
- `/escandalos` — radar de denúncias, contratos suspeitos e dinheiro público
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


## v13.8 — Hotfix coleta rápida

Correção para o botão Atualizar agora ficar preso em “Coletando...” quando havia fontes demais cadastradas.

Mudanças:

- botão manual usa coleta rápida (`mode=quick`);
- rota de coleta tem limite de duração configurado para Vercel;
- cada feed RSS tem timeout próprio;
- coleta para antes de estourar o limite da Vercel;
- cron diário usa modo `scheduled`;
- não inclui `package-lock.json`.


## Rotina automática de coleta pesada

A v13.8 agenda a coleta pesada automaticamente em horário de Brasília:

- 08h30 — primeira varredura editorial do dia
- 11h00 — atualização de meio do dia
- 16h00 — fechamento da tarde

No `vercel.json`, os horários ficam em UTC:

- `30 11 * * *` = 08h30 Brasília
- `0 14 * * *` = 11h00 Brasília
- `0 19 * * *` = 16h00 Brasília

O botão manual continua em modo rápido para não travar a tela.


## v13.8

- Botão **Coleta rápida** para uso normal.
- Botão **Coleta pesada** para buscar mais fontes manualmente, usando `mode=full`.
- A coleta pesada pode retornar parcial para evitar timeout na Vercel.

## v13.9 — Base editorial melhorada

- O botão `Gerar base` agora usa o título real da notícia, resumo coletado, fonte, cidade/região, data e ângulo.
- A matéria-base deixou de ser genérica e passou a destacar o fato central da pauta.
- Instagram e roteiro curto também usam a notícia selecionada como gancho principal.


## v13.10

Inclui radar de escândalos/denúncias com buscas focadas em TCE-SC, MPSC, Gaeco, prefeituras, câmaras, contratos, licitações, saúde, educação e dinheiro público.

## v13.11 — Hotfix JSON / Busca ativa

- Corrige erro `Unexpected token 'A'... is not valid JSON` quando a Vercel retornava texto em timeout.
- Reduz a busca ativa para retorno rápido.
- Remove repercussão pesada da busca ativa manual.
- Mantém coleta pesada no botão/cron próprios.


## v13.12

Hotfix definitivo da Busca ativa/Escândalos: o endpoint `/api/panel/active-search` passou a usar busca segura na base já coletada, retornando JSON sempre e evitando timeout 504 da Vercel. Para buscar notícias novas, use Coleta rápida/pesada ou aguarde os crons.

## v13.13 — Escândalos sem busca manual

- A aba `/escandalos` não chama mais `/api/panel/active-search`.
- Escândalos agora aparecem a partir da base coletada pelo Radar.
- A coleta pesada e os crons automáticos incluem buscas fixas de denúncias, TCE-SC, MPSC, Gaeco, licitação, contrato, superfaturamento, improbidade e dinheiro público.
- Correção definitiva para evitar o erro `Unexpected token 'A'... is not valid JSON` na tela de escândalos.
