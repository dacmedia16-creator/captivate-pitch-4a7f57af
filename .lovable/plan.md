

# Adicionar Gráficos ao Estudo de Mercado e Apresentação

## Resumo
Adicionar gráficos visuais (barras de preços, scatter de preço/m²) na página de detalhe do estudo de mercado e no slide `market_study_placeholder` da apresentação.

## Mudanças

### 1. Página de Estudo de Mercado (`src/pages/agent/MarketStudyDetail.tsx`)
Adicionar dois gráficos entre os cards de cenários e a tabela de comparáveis:
- **Gráfico de barras**: Preço de cada comparável vs preço pretendido do proprietário (linha de referência)
- **Scatter plot**: Preço/m² vs Área, mostrando a dispersão dos comparáveis

Usar Recharts (`BarChart`, `ScatterChart`) já disponível no projeto via `recharts` + `ChartContainer`.

### 2. Slide da Apresentação — seção `market_study_placeholder`
Atualizar os 3 layouts (`LayoutExecutivo.tsx`, `LayoutPremium.tsx`, `LayoutImpactoComercial.tsx`) para renderizar o `market_study_placeholder` com:
- Mini gráfico de barras dos comparáveis (preços)
- Resumo estatístico (média, mediana, preço/m² médio)
- Os dados virão do `content` da section

### 3. Popular content do `market_study_placeholder` no wizard
Atualizar `AgentNewPresentation.tsx` para preencher o conteúdo da section `market_study_placeholder` com os dados dos comparáveis (array de {title, price, area, price_per_sqm}) e estatísticas do report.

### 4. Novo componente `src/components/charts/MarketCharts.tsx`
Componente reutilizável com os dois gráficos, usado tanto na página de detalhe quanto no slide da apresentação (em tamanho reduzido).

## Arquivos
| Arquivo | Mudança |
|---------|---------|
| `src/components/charts/MarketCharts.tsx` | Novo — BarChart + ScatterChart reutilizáveis |
| `src/pages/agent/MarketStudyDetail.tsx` | Adicionar gráficos após cenários de preço |
| `src/components/layouts/LayoutExecutivo.tsx` | Renderizar `market_study_placeholder` com gráfico |
| `src/components/layouts/LayoutPremium.tsx` | Idem |
| `src/components/layouts/LayoutImpactoComercial.tsx` | Idem |
| `src/pages/agent/AgentNewPresentation.tsx` | Popular content do `market_study_placeholder` |

## Detalhes técnicos
- Recharts já está instalado no projeto (usado em `chart.tsx`)
- Gráficos usam as cores do branding (primary + gold)
- No slide, gráfico em tamanho compacto (~200px altura)
- Formatação de valores em BRL com `Intl.NumberFormat`

