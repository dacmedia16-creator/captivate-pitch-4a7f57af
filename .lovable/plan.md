

# Diagnóstico: Dados do estudo de mercado não sincronizam com a apresentação

## Problema

O estudo de mercado "teste 7" mostra valores atualizados (avg_price: R$ 1.028.587, median: R$ 992.100), mas a apresentação vinculada mostra valores antigos (avg_price: R$ 877.345, median: R$ 784.950).

## Causa raiz

Os dados do estudo de mercado são **copiados** para `presentation_sections` no momento da geração da apresentação (`useGeneratePresentation.ts`, linhas 193-203). Quando o estudo é recalculado posteriormente (ex: comparáveis aprovados/removidos, recálculo manual), os novos valores ficam apenas em `market_study_results` — as sections da apresentação **nunca são atualizadas**.

O mesmo acontece com `pricing_scenarios` (linha 205-212): os cenários de preço ficam congelados com os valores do momento da geração.

## Solução

Criar uma função `syncMarketDataToPresentation` que, sempre que o estudo de mercado for recalculado, atualize automaticamente as sections `market_study_placeholder` e `pricing_scenarios` da apresentação vinculada.

### Onde chamar a sincronização

1. **Na página `MarketStudyResult.tsx`** — após o recálculo (botão "Recalcular")
2. **Na edge function `analyze-market-deep`** — ao final, quando grava os resultados
3. **Em `AgentNewPresentation.tsx`** — já existe lógica parcial (linha 322-324), mas usa dados do resultado local, não do `market_study_results`

### Implementação

**Novo hook/função `syncMarketStudySections.ts`:**

```typescript
export async function syncMarketStudySections(marketStudyId: string) {
  // 1. Buscar market_study_results atualizado
  // 2. Buscar comparáveis aprovados
  // 3. Buscar apresentações vinculadas (presentations.market_study_id = X)
  // 4. Para cada apresentação: UPDATE presentation_sections 
  //    SET content = novos dados WHERE section_key IN 
  //    ('market_study_placeholder', 'pricing_scenarios')
}
```

**Chamadas:**
- Após recálculo em `MarketStudyResult.tsx`
- Após `analyze-market-deep` finalizar (na edge function)

### Arquivos modificados
1. `src/hooks/syncMarketStudySections.ts` — nova função (criar)
2. `src/pages/agent/MarketStudyResult.tsx` — chamar sync após recálculo
3. `supabase/functions/analyze-market-deep/index.ts` — chamar sync ao final da execução

