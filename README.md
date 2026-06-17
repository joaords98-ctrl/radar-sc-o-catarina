# Radar SC — O Catarina

Painel profissional para monitorar notícias de Santa Catarina, concorrentes, temas quentes e oportunidades editoriais para o portal **O Catarina**.

## O que ele faz

- Captura notícias via RSS/Google News.
- Pontua cada notícia com um **score de oportunidade**.
- Separa por tema, cidade e região.
- Sugere um **ângulo editorial** para reapuração.
- Mantém fila de status: novo, reapurar, em produção, publicado ou descartado.
- Inclui base inicial de concorrentes do Instagram e principais cidades de Santa Catarina.

## Ajuste para Vercel Hobby

Contas **Hobby** da Vercel aceitam cron diário. Por isso, este projeto já vem configurado para rodar automaticamente **1 vez por dia**, às **08h no horário de Brasília**.

No `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/collect-news",
      "schedule": "0 11 * * *"
    }
  ]
}
```

A Vercel usa horário UTC nos cron jobs. Então `11:00 UTC` equivale a `08:00` no horário de Brasília.

Para atualizar mais vezes sem plano Pro, use o botão **Atualizar agora manualmente** no painel ou acesse:

```txt
https://SEU-DOMINIO.vercel.app/api/cron/collect-news?secret=SEU_CRON_SECRET
```

---

## Importante editorial/jurídico

Use o Radar para **descobrir pautas e fontes**, não para copiar matérias inteiras de outros portais. O fluxo correto é:

1. Abrir a fonte original.
2. Checar se há fonte primária/oficial.
3. Reapurar.
4. Reescrever com título, linha de apoio e ângulo próprios do O Catarina.
5. Citar a origem quando necessário.

Atalho demais vira barranco — e processo também.

---

## 1. Criar banco no Supabase

1. Entre no Supabase.
2. Crie um projeto novo, por exemplo: `radar-sc-o-catarina`.
3. Vá em **SQL Editor**.
4. Cole e execute o arquivo:

```txt
supabase/schema.sql
```

Esse SQL cria as tabelas e insere uma base inicial de cidades, concorrentes e consultas RSS.

---

## 2. Variáveis de ambiente

No Supabase:

- Copie a **Project URL**.
- Copie a **service_role key** em Project Settings → API.

No Vercel, configure:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
RADAR_PASSWORD=uma-senha-forte
CRON_SECRET=um-token-forte
```

`RADAR_PASSWORD` protege o painel com login simples:

- Usuário: `admin`
- Senha: a que você colocou em `RADAR_PASSWORD`

`CRON_SECRET` protege o endpoint de coleta manual.

---

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Abra:

```txt
http://localhost:3000
```

Para rodar a coleta manualmente:

```txt
http://localhost:3000/api/cron/collect-news?secret=SEU_CRON_SECRET
```

---

## 4. Deploy no Vercel

1. Crie um repositório no GitHub.
2. Envie todos os arquivos deste projeto.
3. No Vercel, clique em **Add New Project**.
4. Importe o repositório.
5. Se o nome `radar-sc-o-catarina` já existir, use outro nome, como:
   - `radar-ocatarina`
   - `radar-sc-news`
   - `ocatarina-radar`
6. Configure as variáveis de ambiente.
7. Faça o deploy.

---


## 4.1 Atualização grátis de hora em hora, sem Vercel Pro

No plano Hobby, a Vercel limita o **Vercel Cron** a execuções diárias. Para atualizar várias vezes ao dia sem assinar o Pro, este projeto inclui um workflow do GitHub Actions:

```txt
.github/workflows/collect-news.yml
```

Ele chama o endpoint público protegido por segredo:

```txt
https://SEU-PROJETO.vercel.app/api/cron/collect-news?secret=SEU_CRON_SECRET
```

### Como configurar no GitHub

No repositório, vá em:

```txt
Settings → Secrets and variables → Actions → New repository secret
```

Crie dois secrets:

```txt
RADAR_COLLECT_URL=https://SEU-PROJETO.vercel.app
CRON_SECRET=o-mesmo-token-que-voce-colocou-no-vercel
```

Depois vá em:

```txt
Actions → Coletar notícias do Radar SC → Run workflow
```

Isso força uma primeira coleta manual. Depois, o GitHub Actions chama automaticamente de hora em hora.

### Alternativa simples: cron-job externo

Também funciona usando qualquer serviço externo de cron/monitoramento HTTP. Configure uma chamada GET a cada 30 ou 60 minutos para:

```txt
https://SEU-PROJETO.vercel.app/api/cron/collect-news?secret=SEU_CRON_SECRET
```

Nesse caso, mantenha o `vercel.json` com cron diário ou remova o bloco `crons` para não depender do Vercel Cron.

## 5. Estrutura principal

```txt
app/
  page.tsx                         Dashboard
  news/page.tsx                    Central de notícias
  api/cron/collect-news/route.ts   Coleta automática/manual
  api/news/update-status/route.ts  Atualização de status
components/                        Cards e botões
lib/                               Supabase, RSS, score e coleta
supabase/schema.sql                Banco + seeds
vercel.json                        Cron diário no plano Hobby
.env.example                       Exemplo de ambiente
```

---

## 6. Próximos módulos possíveis

- Botão “Gerar matéria” com IA usando prompt editorial do O Catarina.
- Módulo de concorrentes com análise manual de posts do Instagram.
- Módulo de interatores quentes para prospecção manual.
- Integração com WordPress ou outro CMS.
- Fila de aprovação editorial.
- Notificação por e-mail/WhatsApp quando surgir notícia com score acima de 85.

---

## Atualização v4 — botão de coleta e exportação

Esta versão adiciona:

- Botão **Atualizar agora manualmente** funcionando pelo painel, sem precisar digitar `?secret=` na URL.
- Rota interna `POST /api/panel/collect-news` para disparar coleta manual.
- Exportação CSV das notícias em `/api/export/news.csv?secret=SEU_CRON_SECRET`.
- Correção da dependência `autoprefixer` no `package.json`.
- Ajuste no login para ignorar espaços acidentais no `RADAR_PASSWORD`.

### Segurança

Se você deixar `RADAR_PASSWORD` vazio/removido, o painel e o botão manual ficam abertos para quem tiver o link. Para uso real, recomenda-se reativar:

```env
RADAR_PASSWORD=sua_senha_forte
```

Depois faça um novo deploy limpo na Vercel.

---

## 5. Versão v5 — Concorrência e repercussão em outros meios

Esta versão adiciona uma camada de **análise de concorrência**. O sistema passa a olhar não apenas a notícia isolada, mas também se o mesmo assunto aparece em outros veículos/portais mapeados.

### O que mudou

- Nova aba no painel: **Concorrência** (`/competitors`).
- Novos campos em cada notícia:
  - `media_mentions_count`: quantidade de veiculações/menções detectadas para a pauta.
  - `media_repercussion_score`: score de repercussão editorial.
  - `top_media_sources`: principais veículos/fontes onde a pauta apareceu.
  - `competitor_hits_count`: quantidade de concorrentes mapeados detectados.
  - `competitor_names`: nomes dos concorrentes detectados.
- Nova tabela `source_profiles` com concorrentes e fontes oficiais.
- Nova migration: `supabase/v5_competition.sql`.

### Atualizar banco existente

Se o banco já está criado, rode no Supabase SQL Editor:

```txt
supabase/v5_competition.sql
```

Depois rode uma nova coleta pelo painel ou por:

```txt
/api/cron/collect-news?secret=SEU_CRON_SECRET
```

### Interpretação correta do engajamento

O campo de “repercussão” é uma **métrica proxy editorial**, calculada por:

- número de veiculações detectadas;
- diversidade de fontes;
- presença em concorrentes mapeados;
- peso editorial de cada concorrente;
- força da pauta no score geral.

Ela **não representa likes, comentários, salvamentos ou alcance real do Instagram**, porque esses dados dependem de API oficial/relatórios próprios. Para redes sociais, o caminho correto é importar manualmente os dados do Meta Business Suite ou conectar uma API autorizada.
