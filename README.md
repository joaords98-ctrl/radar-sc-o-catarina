# Radar SC — O Catarina v12

Versão simplificada para operação diária: Clipping primeiro, Busca ativa, Instagram e Pautas.

## Rotas principais

- `/` — início simplificado
- `/clipping` — clipping do dia
- `/radar` — busca ativa por cidade/tema/rodovia
- `/instagram` — fila Instagram
- `/stories` — pautas agrupadas
- `/news` — notícias brutas
- `/competitors` — concorrência

## Atualização

Suba o conteúdo desta pasta para a raiz do GitHub e faça um commit novo.

A raiz precisa ficar assim:

```
app/
components/
lib/
supabase/
package.json
vercel.json
README.md
```

Se `Clipping` não aparecer no menu depois do deploy, a Vercel ainda está usando commit antigo ou os arquivos foram enviados para uma pasta interna errada.
