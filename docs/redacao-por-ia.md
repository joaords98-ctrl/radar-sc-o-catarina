# Redação automática de matérias (rascunho por IA — Gemini grátis)

A aba **Produção → Gerar base** agora tenta **redigir um rascunho original**
da matéria a partir dos fatos apurados na fonte, em vez de devolver o texto
genérico de "pauta em apuração". Usa o **Gemini** no nível gratuito do Google.

## Como funciona

1. O sistema resolve o link real (saindo do Google News) e lê a matéria original.
2. Os fatos extraídos são enviados para o Gemini **apenas como material de apuração**.
3. O Gemini redige uma matéria **nova, com texto próprio** (não copia nem parafraseia
   o concorrente), no tom do O Catarina.
4. O rascunho vem com uma lista de **itens para a redação confirmar** antes de publicar.
5. **Nada é publicado automaticamente.** A redação revisa e decide.

Se a IA não conseguir rodar (sem chave, sem fatos suficientes na fonte, ou erro
de rede), o sistema volta ao comportamento antigo — nada quebra.

## Configuração: chave do Gemini (grátis, sem cartão)

Sem a variável `GEMINI_API_KEY`, a redação por IA fica desligada (e a aba
funciona como antes). Para ligar:

### 1. Criar a chave (grátis)
- Acesse **aistudio.google.com/apikey** (Google AI Studio)
- Faça login com uma conta Google
- Clique em **Create API key** e copie a chave gerada
- Não precisa de cartão de crédito e a chave não expira

### 2. Adicionar na Vercel
- No projeto na Vercel: **Settings → Environment Variables**
- Nome: `GEMINI_API_KEY`
- Valor: a chave copiada
- (Opcional) `GEMINI_MODEL` para trocar o modelo (padrão: `gemini-2.5-flash`)
- Marque Production / Preview e salve
- Faça um **redeploy** para a variável valer

### 3. Testar localmente (opcional)
Crie um `.env.local` na raiz (NÃO versionar — já está no `.gitignore`):

```
GEMINI_API_KEY=sua-chave-aqui
```

## Limites do nível gratuito (mudam sem aviso)

Os modelos Flash são os disponíveis no grátis. Para o `gemini-2.5-flash`, os
limites giram em torno de ~15 requisições por minuto e ~1.500 por dia — sobra
para uma redação que gera dezenas de rascunhos por dia. O Google revisa esses
números sem aviso e varia por região, então não trate como garantido. Os limites
são por projeto do Google Cloud, não por chave (criar várias chaves não aumenta a cota).

## Privacidade — atenção editorial

No nível **gratuito**, o Google pode usar o conteúdo enviado para treinar seus
modelos. Para apuração sensível (denúncia, investigação), pese isso. Se quiser
blindar a privacidade no futuro, dá para ativar o tier pago do Gemini (que não
treina com seus dados) usando a mesma chave/projeto, sem mexer no código.

## Observação editorial e jurídica

O rascunho é **ponto de partida**, não matéria final. A IA pode errar nomes,
números e datas. A revisão humana antes de publicar é o que mantém a qualidade
e protege o portal — por isso a checagem vem embutida em todo rascunho.

### Trocar de IA depois
Se um dia quiser usar outra IA (Claude, OpenAI etc.), basta trocar a função
`writeDraftWithAI` em `lib/aiWriter.ts`. O resto do sistema não muda.
