

# Plano: Corrigir mistura de aluguéis com vendas no scoring

## Problema confirmado

O teste completo do Cannes mostrou que o fluxo background funciona — 8 comparáveis foram inseridos no banco com adjustments e results. Porém **4 dos 8 comparáveis são aluguéis** (R$ 3.000-4.300/mês) misturados com vendas (R$ 650.000-1.600.000), distorcendo brutalmente as métricas:

- avg_price calculado: R$ 453.111 (deveria ser ~R$ 670.000+)
- median_price: R$ 327.150 (sem sentido)

## Causa raiz

O filtro de similaridade (`calculateSimilarityScore`) não verifica o propósito (venda vs aluguel). A IA extrai corretamente os títulos com "para alugar" e "para comprar", mas o scoring aceita ambos.

## Correções em `supabase/functions/analyze-market-deep/index.ts`

### 1. Filtrar por propósito no scoring
Adicionar verificação: se o título do comparável contém "alugar"/"aluguel" e o subject é "venda" (ou vice-versa), descartar com score = 0.

```typescript
// No início do calculateSimilarityScore ou antes dele:
const subjectPurpose = property.property_purpose || "venda";
const isRental = /alugu[e]?[lr]|para alugar/i.test(c.title || "");
const isSale = /comprar|venda/i.test(c.title || "");

if (subjectPurpose === "venda" && isRental && !isSale) return 0;
if (subjectPurpose === "aluguel" && isSale && !isRental) return 0;
```

### 2. Filtrar por faixa de preço razoável (heurística)
Quando o subject é "venda" e o preço do comparável é < R$ 10.000, descartar (é claramente aluguel). Vice-versa para aluguel.

### 3. Filtrar URLs de aluguel na FASE 1
Na URL prioritization, descartar URLs com `/aluguel/` quando o propósito é venda.

## Etapas
1. Adicionar filtro de propósito por título no scoring
2. Adicionar heurística de preço mínimo para vendas (< R$10k = descarte)
3. Filtrar URLs `/aluguel/` na FASE 1 quando purpose = venda
4. Deploy + re-teste com curl no mesmo study_id

## Arquivo modificado
`supabase/functions/analyze-market-deep/index.ts`

