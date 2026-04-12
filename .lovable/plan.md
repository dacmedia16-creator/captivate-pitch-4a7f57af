

# Fase 3 — Tela de Resultado Premium

## O que será criado

### 1. Edge Function `generate-market-summary`
Arquivo: `supabase/functions/generate-market-summary/index.ts`

Usa Lovable AI (Gemini Flash) para gerar:
- Resumo executivo em linguagem profissional para apresentar ao proprietário
- Justificativa de preço baseada nos comparáveis e ajustes
- Insights de mercado (acima do mercado, competitivo, boa liquidez, risco de superavaliação)

Recebe: dados do imóvel avaliado, comparáveis com ajustes, resultado de preços. Retorna JSON estruturado via tool calling.

### 2. Componentes visuais novos

**`src/components/market-study/PriceRangeGauge.tsx`**
Gauge visual horizontal mostrando:
- Faixa min-max como barra de fundo
- Marcadores para: venda rápida, mercado, anúncio
- Posição do preço esperado do proprietário (se houver)
- Labels com valores formatados em BRL

**`src/components/market-study/MarketInsights.tsx`**
Grid de 4 cards com insights baseados nos dados:
- Imóvel acima do mercado (preço esperado > sugerido anúncio)
- Imóvel competitivo (preço na faixa)
- Boa liquidez (muitos comparáveis similares)
- Risco de superavaliação (preço esperado > P95)

Cada card com ícone, cor de destaque e descrição curta.

**`src/components/market-study/PricePerSqmChart.tsx`**
Gráfico de barras horizontal com R$/m² de cada comparável vs média. Reutiliza Recharts (já instalado).

### 3. Atualizar `MarketStudyResult.tsx`

Reestruturar a página com layout premium:

1. **Header** — título, bairro, badge de status, botões (recalcular, gerar resumo IA, exportar)
2. **Métricas** — 4 metric cards usando MetricCard existente (preço médio, R$/m², sugestão anúncio, venda rápida)
3. **PriceRangeGauge** — faixa visual com os 3 preços sugeridos
4. **MarketInsights** — grid de insights automáticos
5. **Resumo Executivo** — card com texto gerado por IA (botão "Gerar com IA" se não existir)
6. **Gráficos lado a lado** — R$/m² por comparável (barras) + Scatter área vs preço (já existe em MarketCharts)
7. **Tabela comparativa** — a tabela existente com ajustes

### 4. Botão "Gerar Resumo com IA"

Chama a edge function `generate-market-summary`, salva executive_summary, justification e market_insights na tabela `market_study_results`, e atualiza a UI.

## Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/generate-market-summary/index.ts` | Criar |
| `src/components/market-study/PriceRangeGauge.tsx` | Criar |
| `src/components/market-study/MarketInsights.tsx` | Criar |
| `src/components/market-study/PricePerSqmChart.tsx` | Criar |
| `src/pages/agent/MarketStudyResult.tsx` | Reescrever — layout premium completo |

Nenhuma migração necessária — os campos `executive_summary`, `justification` e `market_insights` já existem em `market_study_results`.

