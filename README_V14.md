# Radar SC v14.4 — Radar híbrido

Esta entrega deixa o Radar em um modelo híbrido: a operação principal pode ficar aberta, mas a redação fica protegida por login.

## 1. Modo recomendado: clipping aberto e redação com login

Use quando quiser que a equipe veja o Radar sem senha, mas proteja a geração de base e exportação de matéria.

Variáveis na Vercel:

```env
RADAR_REQUIRE_LOGIN=false
RADAR_MODE=public
RADAR_PROTECT_EDITORIAL=true
RADAR_ADMIN_PASSWORD=troque-esta-senha
RADAR_ADMIN_TOKEN=troque-este-token-grande-e-aleatorio
```

Ficam abertos sem login:

- início;
- clipping;
- escândalos;
- linha de produção;
- Instagram;
- fontes sociais;
- concorrência.

Ficam com login:

- `/redacao`;
- `/draft`;
- botão **Gerar base**;
- exportação da matéria pronta para o site.
- **Coleta pesada**.

## Coleta rápida e coleta pesada

A coleta rápida continua disponível no painel aberto.

A coleta pesada fica somente na tela:

```txt
/redacao
```

A API também fica protegida:

```txt
/api/panel/collect-news?mode=full
```

Ou seja: mesmo que alguém tente chamar a rota manualmente, a coleta pesada exige login.

## 2. Versão completa com login

Use quando quiser proteger o painel inteiro.

Variáveis na Vercel:

```env
RADAR_REQUIRE_LOGIN=true
RADAR_MODE=private
RADAR_PROTECT_EDITORIAL=true
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
app/redacao/page.tsx
app/api/auth/login/route.ts
app/api/auth/logout/route.ts
app/draft/page.tsx
components/CopyBlock.tsx
components/ManualCollectButton.tsx
.env.sem-login.example
.env.com-login.example
```

Não exige SQL novo no Supabase.

Commit sugerido:

```txt
Update v14.4 coleta pesada na redacao
```
