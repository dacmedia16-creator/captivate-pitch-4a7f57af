

# Fix: Teste 21 travado — `extractWithAI` sem tratamento de resposta vazia

## Diagnóstico

O Teste 21 está preso em `processing` com 0 comparáveis. O erro é:

```
SyntaxError: Unexpected end of JSON input
  at extractWithAI (inngest-serve/index.ts:875)
```

**Causa**: Na linha 525, `(await aiRes.json())` falha quando a API de IA retorna body vazio ou truncado (status 200 mas sem conteúdo válido). Não há try/catch, então o step do Inngest falha e fica em loop de retry.

## Correção

### `supabase/functions/inngest-serve/index.ts`

**Envolver o parse do JSON da IA em try/catch** (linhas 525-526):

```typescript
// ANTES:
const tc = (await aiRes.json()).choices?.[0]?.message?.tool_calls?.[0];
if (!tc) return preExtracted;

// DEPOIS:
let tc;
try {
  const aiBody = await aiRes.text();
  if (!aiBody || aiBody.length < 10) {
    console.warn(`[INNGEST][FASE 3] AI retornou body vazio (${aiBody.length} chars)`);
    return preExtracted;
  }
  tc = JSON.parse(aiBody).choices?.[0]?.message?.tool_calls?.[0];
} catch (parseErr) {
  console.error(`[INNGEST][FASE 3] Falha ao parsear resposta da IA:`, parseErr);
  return preExtracted;
}
if (!tc) return preExtracted;
```

Isso faz a função retornar os comparáveis pré-extraídos (se houver) ao invés de crashar quando a IA retorna resposta inválida.

### Resetar o Teste 21

Atualizar o status do estudo para `failed` via migration para destravar:

```sql
UPDATE market_studies SET status = 'failed' WHERE id = '5ffc5d2b-1a50-4713-9333-f3faa59823ae' AND status = 'processing';
```

## Escopo
- 1 arquivo editado (1 bloco de ~12 linhas)
- 1 migration (1 UPDATE)
- Redeploy de 1 edge function

