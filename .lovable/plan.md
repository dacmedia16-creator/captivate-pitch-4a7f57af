

# Alterar Padrão do Filtro de Idade do Anúncio para 12 meses

Mudança simples: trocar o valor default de `maxListingAgeMonths` de `"6"` para `"12"` em dois lugares.

## Alterações

### 1. `src/pages/agent/AgentNewPresentation.tsx` (linha 43)
- Alterar `maxListingAgeMonths: "6"` → `maxListingAgeMonths: "12"`

### 2. `src/components/market-study/SearchConfigForm.tsx`
- Verificar se há valor default e alterar para `12` também

