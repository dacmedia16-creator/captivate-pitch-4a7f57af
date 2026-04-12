

# Adicionar Min/Max de Comparáveis + Links dos Portais

## O que muda

### 1. Trocar "Nº de comparáveis" por Min e Max

**Arquivo:** `src/components/wizard/StepMarketStudy.tsx`

- Substituir o campo único `maxComparables` por dois campos: `minComparables` e `maxComparables` (inputs numéricos lado a lado)
- Labels: "Mín. de imóveis" e "Máx. de imóveis"

**Arquivo:** `src/components/wizard/StepMarketStudy.tsx` (interface `MarketStudyData`)

- Adicionar `minComparables: string` à interface

### 2. Mostrar links dos portais habilitados

**Arquivo:** `src/components/wizard/StepMarketStudy.tsx`

- Nos itens de portais, exibir o `base_url` do portal como link clicável (abre em nova aba) para o corretor conferir antes de gerar
- Usar o campo `portal_sources.base_url` que já vem no join

### 3. Atualizar estado inicial e filtros enviados

**Arquivo:** `src/pages/agent/AgentNewPresentation.tsx`

- Adicionar `minComparables: "5"` ao `emptyMarket`
- Passar `minComparables` nos filtros do `market_analysis_jobs` e no body das edge functions

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/wizard/StepMarketStudy.tsx` | Modificar — interface + UI (min/max inputs + links) |
| `src/pages/agent/AgentNewPresentation.tsx` | Modificar — emptyMarket + filtros |

