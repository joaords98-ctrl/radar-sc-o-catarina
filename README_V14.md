# Radar SC v14 — Sem Login e Com Login

Esta entrega cria dois modos no mesmo projeto.

## 1. Versão sem login

Use quando quiser um Radar mais simples, aberto para quem tiver o link.

Variáveis na Vercel:

```env
RADAR_REQUIRE_LOGIN=false
RADAR_MODE=public
```

Nesse modo, o sistema continua funcionando como hoje: clipping, coleta rápida, coleta pesada, escândalos, produção, Instagram e concorrência sem tela de login.

## 2. Versão completa com login

Use quando quiser proteger o painel editorial.

Variáveis na Vercel:

```env
RADAR_REQUIRE_LOGIN=true
RADAR_MODE=private
RADAR_ADMIN_PASSWORD=troque-esta-senha
RADAR_ADMIN_TOKEN=troque-este-token-grande-e-aleatorio
```

Recomendação:

- `RADAR_ADMIN_PASSWORD`: senha que a equipe digita na tela de login.
- `RADAR_ADMIN_TOKEN`: token grande e aleatório, diferente da senha.

Com login ativo, o middleware protege páginas e APIs internas. A rota `/login` fica pública.

## Exportar matéria pronta para o site

O botão **Gerar base** agora abre uma tela com:

- título do site;
- linha de apoio;
- corpo pronto para publicar;
- checklist interno separado;
- legenda de Instagram;
- roteiro de vídeo curto.

Na tela de draft, a redação pode:

- copiar a matéria do site;
- baixar `.txt`;
- baixar `.html`;
- baixar `.json`;
- copiar tudo.

## Arquivos incluídos

Copie estes arquivos por cima do repositório atual:

```txt
middleware.ts
lib/radarAccess.ts
app/layout.tsx
app/login/page.tsx
app/api/auth/login/route.ts
app/api/auth/logout/route.ts
app/draft/page.tsx
components/CopyBlock.tsx
.env.sem-login.example
.env.com-login.example
```

Não exige SQL novo no Supabase.

Commit sugerido:

```txt
Update v14 login opcional e exportacao site
```
