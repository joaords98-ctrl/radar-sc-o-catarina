# Radar SC — O Catarina

Painel profissional para monitorar notícias de Santa Catarina, concorrentes, temas quentes e oportunidades editoriais para o portal **O Catarina**.

## O que ele faz

- Captura notícias via RSS/Google News de hora em hora.
- Pontua cada notícia com um **score de oportunidade**.
- Separa por tema, cidade e região.
- Sugere um **ângulo editorial** para reapuração.
- Mantém fila de status: novo, reapurar, em produção, publicado ou descartado.
- Inclui base inicial de concorrentes do Instagram e principais cidades de Santa Catarina.

## Importante

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
CRON_SECRET=um-token-opcional
```

`RADAR_PASSWORD` protege o painel com login simples:

- Usuário: `admin`
- Senha: a que você colocou em `RADAR_PASSWORD`

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
http://localhost:3000/api/cron/collect-news
```

---

## 4. Deploy no Vercel

1. Crie um repositório no GitHub, por exemplo: `radar-sc-o-catarina`.
2. Envie todos os arquivos deste projeto.
3. No Vercel, clique em **Add New Project**.
4. Importe o repositório.
5. Configure as variáveis de ambiente.
6. Faça o deploy.

O arquivo `vercel.json` já agenda o cron para rodar a cada hora:

```json
{
  "crons": [
    {
      "path": "/api/cron/collect-news",
      "schedule": "0 * * * *"
    }
  ]
}
```

---

## 5. Estrutura principal

```txt
app/
  page.tsx                         Dashboard
  news/page.tsx                    Central de notícias
  api/cron/collect-news/route.ts   Coleta automática
  api/news/update-status/route.ts  Atualização de status
components/                        Cards e botões
lib/                               Supabase, RSS, score e coleta
supabase/schema.sql                Banco + seeds
vercel.json                        Cron job
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
