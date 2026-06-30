# Radar SC v14.16 — Radar híbrido

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
PORTAL_DRAFT_ENDPOINT=https://seu-portal.com/api/radar/drafts
PORTAL_DRAFT_TOKEN=troque-este-token-do-portal
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

- categoria correta da notícia;
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
- enviar para o site como rascunho.
- enviar para o portal sem gravar link da fonte no corpo da matéria.

## Padrão editorial do O Catarina

O gerador segue este padrão:

- separa fato confirmado de suspeita, denúncia, investigação ou acusação;
- não inventa dados;
- não afirma culpa sem condenação ou confirmação oficial;
- preserva vítimas, crianças, adolescentes e pessoas vulneráveis;
- prioriza checagem com MPSC, Polícia Civil, Polícia Militar, TJSC, Prefeitura, Defesa Civil, Corpo de Bombeiros, PRF, TCE/SC ou órgão responsável;
- usa tom jornalístico, claro, firme e juridicamente seguro;
- em política, gestão pública, corrupção, gasto público ou denúncia, pode destacar impacto ao contribuinte, transparência e responsabilidade pública.

A saída da matéria fica no formato:

```txt
Categoria correta da notícia: ...

# Título

**Linha de apoio curta.**

Texto jornalístico...
```

## Conteúdo real da fonte

A coleta agora tenta resolver links do Google News para encontrar o link original do portal e enriquecer o resumo salvo no Radar.

No **Gerar base**, o Radar também tenta abrir a fonte e extrair descrição/parágrafos. Se não conseguir puxar conteúdo suficiente, o rascunho passa a ser marcado como **pauta em apuração**, em vez de parecer matéria final.

Isso evita textos genéricos como se fossem notícia pronta quando só existe título + fonte + ângulo.

## Enviar para a redação do portal

Na Vercel do Radar, configure:

```env
PORTAL_DRAFT_ENDPOINT=https://seu-portal.com/api/radar/drafts
PORTAL_DRAFT_TOKEN=troque-este-token-do-portal
```

Quando o usuário clicar em **Enviar para o site como rascunho**, o Radar envia:

```json
{
  "title": "Título da matéria",
  "excerpt": "Linha de apoio",
  "content": "Corpo da matéria",
  "status": "draft",
  "category": "Categoria",
  "city": "Cidade",
  "sourceUrl": "Link da fonte",
  "origin": "radar-sc-o-catarina"
}
```

O portal precisa ter uma rota recebendo `POST` em `/api/radar/drafts`.

Resposta esperada do portal:

```json
{
  "ok": true,
  "id": "123",
  "editUrl": "https://seu-portal.com/admin/noticias/123"
}
```

Se o portal for WordPress, a rota pode ser substituída por um endpoint interno que chama a REST API do WordPress criando post com `status=draft`.

Se o portal for Next/Supabase, a rota deve inserir na tabela de posts/notícias com status `draft` ou `rascunho`.

O corpo enviado ao portal não deve levar link da fonte. A fonte fica no checklist interno do Radar.

Incluí um exemplo em:

```txt
docs/portal-next-api-example.ts
```

Ele não deve ser copiado cegamente. Ajuste a tabela `posts`, nomes de colunas e URL de edição conforme o portal real.

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
components/SendDraftToPortalButton.tsx
app/api/portal/send-draft/route.ts
docs/portal-next-api-example.ts
.env.sem-login.example
.env.com-login.example
```

Não exige SQL novo no Supabase.

Commit sugerido:

```txt
Update v14.6 padrao editorial e rascunho portal
```

## v14.17 — Filtro anti Google News genérico

Esta correção impede que textos genéricos do Google News, como "Comprehensive up-to-date news coverage...", virem matéria ou rascunho.

Mudanças:

- A coleta ignora itens cujo título/descrição sejam texto institucional do Google News.
- A coleta tenta salvar resumo apenas quando houver texto editorial útil.
- O gerador não usa descrições genéricas como se fossem notícia.
- Se não houver conteúdo real, o rascunho fica como pauta em apuração.

Depois do deploy, rode uma coleta pesada nova. Pautas antigas já salvas com conteúdo fraco podem continuar aparecendo até serem descartadas/recoletadas.
