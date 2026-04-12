

# Remover Limite de Portais na Edge Function

## Problema
A edge function `analyze-market-deep` tem um `slice(0, 3)` fixo que limita a busca a apenas 3 portais, ignorando Imóvel Web e Kenlo.

## Alteração

**`supabase/functions/analyze-market-deep/index.ts`** (linhas 152-156):

Remover o `slice(0, 3)` e usar todos os portais configurados. Ajustar `resultsPerPortal` proporcionalmente para não estourar créditos do Firecrawl.

```typescript
// Antes:
const limitedPortals = searchablePortals.slice(0, 3);
if (searchablePortals.length > 3) {
  limitations.push(`Limitado a 3 de ${searchablePortals.length} portais`);
}

// Depois:
const limitedPortals = searchablePortals; // Sem limite de portais
```

Paralelizar as buscas da FASE 1 com `Promise.allSettled` ao invés do `for...of` sequencial (linha 168), para que mais portais não multipliquem o tempo de execução.

## Arquivo afetado

| Arquivo | Ação |
|---------|------|
| `supabase/functions/analyze-market-deep/index.ts` | Remover slice, paralelizar buscas |

