

# Adicionar botão Retry na listagem de estudos (MarketStudies.tsx)

## O que será feito

Adicionar um botão "Tentar novamente" (com ícone RefreshCw) em cada card de estudo com `status === "failed"` na página de listagem. O botão reutilizará a mesma lógica de retry já implementada em `MarketStudyResult.tsx`.

## Mudanças

### `src/pages/agent/MarketStudies.tsx`

1. Adicionar imports: `RefreshCw`, `useMutation`/`useQueryClient` do react-query, `supabase`, `toast`
2. Extrair a lógica de retry em uma função `handleRetry(studyId)` que:
   - Busca `market_study_subject_properties` do estudo
   - Busca `tenant_portal_settings` + fallback para portais globais
   - Atualiza status para `processing`
   - Invoca `analyze-market-deep` com os dados originais
   - Invalida a query de listagem
3. No card de cada estudo com `status === "failed"`, renderizar um botão `RefreshCw` ao lado do badge, com `onClick` que chama `handleRetry` e `e.stopPropagation()` para não navegar ao estudo
4. Mostrar estado de loading (Loader2 spinner) no botão durante o retry

### Nenhuma mudança em banco ou outros arquivos

A lógica é 100% frontend, reutilizando a edge function `analyze-market-deep` já existente.

