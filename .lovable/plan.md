

# Módulo Estudo de Mercado — Plano de Implementação

Este é um módulo grande. Vou dividir em **4 fases** para entregar valor incremental sem quebrar o que já existe.

---

## Fase 1 — Banco de Dados + Formulário Completo do Imóvel

### Migração SQL
Criar as novas tabelas (todas com RLS multi-tenant):

- **`market_studies`** — tabela principal do estudo (tenant_id, broker_id, status, title, purpose, created_at, updated_at). Independente de `presentations`.
- **`market_study_subject_properties`** — dados completos do imóvel avaliado (todos os campos do formulário: finalidade, tipo, categoria, endereço, CEP, áreas, quartos, suítes, banheiros, vagas, salas, lavabos, idade, padrão construtivo, estado de conservação, diferenciais como JSONB, valor condomínio, IPTU, objetivo da precificação, observações).
- **`market_study_comparables`** — comparáveis do estudo (dados do imóvel + similarity_score 0-100, status ativo/vendido/desatualizado, ajustes aplicados como JSONB, source_url, source_name, is_approved).
- **`market_study_adjustments`** — ajustes individuais por comparável (comparable_id, adjustment_type, label, percentage, value, direction: positive/negative/neutral).
- **`market_study_results`** — resultado final (avg_price, median_price, avg_price_per_sqm, suggested_ad_price, suggested_market_price, suggested_fast_sale_price, price_range_min, price_range_max, executive_summary, justification, market_insights JSONB, confidence_level).
- **`market_study_settings`** — configurações de pesos e regras por tenant (tenant_id, adjustment_weights JSONB, similarity_weights JSONB, default_filters JSONB).

RLS: broker vê os próprios, agency_admin vê do tenant, super_admin vê tudo.

### Novas Páginas e Rotas
- `/market-studies` — lista de estudos (substituir `/market-study`)
- `/market-studies/new` — wizard de criação (multi-step)
- `/market-studies/:id` — resultado completo
- `/market-studies/:id/comparables` — tela de comparáveis com edição
- `/market-studies/:id/edit` — editar estudo

### Formulário Multi-Step (Wizard)
4 steps:
1. **Dados do Imóvel** — formulário completo com todos os campos solicitados (finalidade, tipo, categoria, endereço, áreas, quartos, suítes, banheiros, vagas, salas, lavabos, idade, padrão, estado de conservação, diferenciais como checkboxes, condomínio/IPTU, objetivo da precificação, observações)
2. **Configuração de Pesquisa** — portais, raio, filtros de área/preço, nº de comparáveis
3. **Geração** — tela de progresso com polling do status
4. **Resultado** — redirect para a tela de resultado

### Sidebar
Atualizar o menu do agente: trocar "Estudo de Mercado" para apontar para `/market-studies`.

---

## Fase 2 — Motor de Similaridade + Ajustes Automáticos

### Hook `useMarketSimilarity`
Calcular similarity score (0-100) com pesos configuráveis:
- Mesmo condomínio: +25 pontos
- Mesmo bairro: +20 pontos
- Mesmo tipo: +15 pontos
- Faixa de metragem (±20%): +15 pontos
- Quartos/suítes/vagas próximos: +10 pontos
- Mesmo padrão: +10 pontos
- Descartar se score < 30

### Hook `useMarketAdjustments`
Ajustes automáticos baseados em diferenças:
- Piscina: +3-5%
- Área gourmet: +2-3%
- Suíte master: +2%
- Mais vagas: +1-2% por vaga
- Terreno maior: proporcional
- Estado de conservação: ±3-8%
- Idade: ±2-5%
- Vista privilegiada: +3-5%

Cada ajuste gera um registro em `market_study_adjustments` com direção (positivo/negativo/neutro).

### Recálculo Automático
Quando o usuário alterar filtros ou aprovar/rejeitar comparáveis, recalcular scores e preços em tempo real.

---

## Fase 3 — Tela de Resultado Premium

### Componentes Visuais
- **ExecutiveSummary** — card com resumo textual gerado por IA (Gemini)
- **PriceRangeChart** — gráfico de faixa de preço (min/mercado/aspiracional) com gauge visual
- **PricePerSqmChart** — gráfico de barras R$/m² dos comparáveis vs imóvel
- **ComparativeTable** — tabela expandida com ajustes por coluna, badges de score, status (ativo/vendido)
- **AdjustmentBadges** — badges visuais verde (positivo), vermelho (negativo), cinza (neutro)
- **MarketInsights** — cards com insights (acima do mercado, competitivo, boa liquidez, risco de superavaliação)
- **RecommendationBlock** — bloco final com recomendação de preço e justificativa

### Geração de Resumo por IA
Edge function que usa Gemini para gerar:
- Resumo executivo em linguagem profissional
- Justificativa de preço
- Insights de mercado
Usando os dados dos comparáveis e ajustes como input.

---

## Fase 4 — Exportação PDF + Integração com Apresentação

### Exportar PDF
Edge function `export-market-study-pdf` que gera PDF profissional com:
- Capa com dados do imóvel e logo da imobiliária
- Resumo executivo
- Tabela comparativa
- Gráficos (renderizados como imagens)
- Recomendação final

### Transformar em Apresentação
Botão que cria uma apresentação a partir do estudo, preenchendo as sections de pricing/market com os dados do estudo.

### Duplicar Estudo
Copiar estudo existente com novos IDs para reutilização.

---

## Arquivos Principais

| Arquivo | Ação |
|---------|------|
| Migração SQL (6 tabelas + RLS) | Criar |
| `src/pages/agent/MarketStudies.tsx` | Criar — lista |
| `src/pages/agent/NewMarketStudy.tsx` | Criar — wizard |
| `src/pages/agent/MarketStudyResult.tsx` | Criar — resultado |
| `src/pages/agent/MarketStudyComparables.tsx` | Criar — comparáveis |
| `src/components/market-study/StudyWizard.tsx` | Criar — wizard steps |
| `src/components/market-study/SubjectPropertyForm.tsx` | Criar — formulário completo |
| `src/components/market-study/ComparableCard.tsx` | Criar |
| `src/components/market-study/AdjustmentBadge.tsx` | Criar |
| `src/components/market-study/PriceRangeGauge.tsx` | Criar |
| `src/components/market-study/ExecutiveSummary.tsx` | Criar |
| `src/components/market-study/MarketInsights.tsx` | Criar |
| `src/hooks/useMarketSimilarity.ts` | Criar |
| `src/hooks/useMarketAdjustments.ts` | Criar |
| `supabase/functions/generate-market-summary/index.ts` | Criar — resumo IA |
| `src/App.tsx` | Modificar — novas rotas |
| `src/components/AppSidebar.tsx` | Modificar — nav atualizada |

---

## Abordagem

Devido ao tamanho, vou implementar **Fase 1 primeiro** (DB + wizard + formulário + lista). Depois de testar, seguimos com as fases seguintes. Cada fase é funcional de forma independente.

