

# Adicionar Scatter Chart (Área vs Preço) ao Resultado do Estudo

## O que será feito

Adicionar um gráfico scatter plot mostrando Área (m²) vs Preço de cada comparável aprovado, ao lado do gráfico de R$/m² já existente. Os dois gráficos ficarão em grid 2 colunas (lg) / 1 coluna (mobile).

## Alterações

### 1. `src/pages/agent/MarketStudyResult.tsx`
- Importar `MarketScatterChart` de `@/components/charts/MarketCharts` (já existe)
- Envolver o card de R$/m² e um novo card de scatter em `div className="grid grid-cols-1 lg:grid-cols-2 gap-6"`
- O novo card terá título "Área vs Preço" com ícone `ScatterChart` (lucide)
- Mapear `approvedComparables` para o formato `ComparableChartData` esperado pelo `MarketScatterChart`

### 2. Nenhum componente novo
O `MarketScatterChart` já existe em `src/components/charts/MarketCharts.tsx` e aceita `comparables: ComparableChartData[]` com campos `title`, `price`, `area`, `price_per_sqm`.

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/agent/MarketStudyResult.tsx` | Modificar — grid 2 cols + novo card scatter |

