

# Corrigir ordem: Cenários de Preço depois de Comparáveis

## Problema
Nas apresentações existentes, `pricing_scenarios` tem `sort_order=12` (anterior à mudança dos 3 slides), enquanto `market_study_comparables` tem 13. Resultado: cenários aparecem antes dos comparáveis.

## Solução

### 1. Migration SQL — corrigir dados existentes
```sql
UPDATE presentation_sections 
SET sort_order = 14 
WHERE section_key = 'pricing_scenarios';

UPDATE presentation_sections 
SET sort_order = 15 
WHERE section_key = 'required_documentation';

UPDATE presentation_sections 
SET sort_order = 16 
WHERE section_key = 'closing';
```

### 2. `syncMarketStudySections.ts` — garantir que o sync também atualiza o sort_order do pricing
Adicionar no loop de sync uma atualização do `sort_order` de `pricing_scenarios` para 14 (já atualiza o content, basta incluir sort_order no update).

### 3. `batch-sync-market-slides/index.ts` — mesma correção
Incluir atualização do sort_order de `pricing_scenarios`, `required_documentation` e `closing` no batch sync.

## Arquivos

| Arquivo | Mudança |
|---------|---------|
| DB (migration) | UPDATE sort_order de pricing/docs/closing |
| `src/hooks/syncMarketStudySections.ts` | Atualizar sort_order do pricing_scenarios para 14 |
| `supabase/functions/batch-sync-market-slides/index.ts` | Idem |

