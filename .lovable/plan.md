

# Unificar Estudo de Mercado com Apresentação + Remover Simulados

## Problema

Atualmente existem dois fluxos separados:
- **Wizard de Apresentação** (`/presentations/new`) — tem step "Mercado" que chama Manus, mas salva em tabelas diferentes (`market_analysis_jobs`, `market_comparables`, `market_reports`)
- **Estudo de Mercado standalone** (`/market-studies/new`) — fluxo separado com suas próprias tabelas (`market_studies`, `market_study_comparables`, `market_study_results`)

O usuário quer um fluxo unificado: o estudo de mercado deve ser parte do fluxo da apresentação, sem simulados, e o módulo standalone deve ser removido.

## Solução

### 1. Remover fallback de dados simulados

**Arquivos:** `AgentNewPresentation.tsx`, `NewMarketStudy.tsx`

- Remover import e uso de `generateSimulatedComparables`
- Se Manus e Firecrawl falharem, mostrar erro ao usuário em vez de usar dados falsos
- O fluxo continua criando a apresentação, mas sem dados de mercado (seções ficam vazias)

### 2. Integrar estudo de mercado no wizard da apresentação

**Arquivo:** `AgentNewPresentation.tsx`

No `handleGenerate`, após chamar Manus/Firecrawl com sucesso:
- Criar automaticamente um registro em `market_studies` vinculado à apresentação
- Salvar o imóvel em `market_study_subject_properties` (mapeando de `PropertyData`)
- Salvar os comparáveis em `market_study_comparables`
- Rodar `scoredComparables` + `calculateAllAdjustments` + `calculateMarketResult` para gerar os resultados completos
- Salvar em `market_study_results` com resumo executivo
- Chamar `generate-market-summary` para gerar insights por IA
- Vincular o `market_study_id` à apresentação (via campo ou metadata)

Isso garante que cada apresentação com dados de mercado também gera um estudo completo acessível em `/market-studies/:id`.

### 3. Remover o fluxo standalone de criação de estudo

**Rotas removidas:**
- `/market-studies/new` — remover rota e lazy import
- `/market-studies` (listagem) — manter, mas remover botão "Novo Estudo"

**Sidebar:** Manter link "Estudos de Mercado" que lista os estudos gerados automaticamente pelas apresentações.

**Arquivos a remover/simplificar:**
- `src/pages/agent/NewMarketStudy.tsx` — deletar (fluxo standalone)
- `src/components/market-study/SubjectPropertyForm.tsx` — manter (usado no resultado)
- `src/components/market-study/SearchConfigForm.tsx` — manter (filtros reutilizáveis no wizard)

### 4. Atualizar listagem de estudos

**Arquivo:** `MarketStudies.tsx`

- Remover botão "Novo Estudo de Mercado"
- Adicionar informação de qual apresentação gerou cada estudo
- Estudos são criados automaticamente pelo wizard

### 5. Manter MarketStudyResult como está

A tela de resultado (`/market-studies/:id`) continua funcionando normalmente com todos os gráficos, insights, exportação PDF e botão "Criar Apresentação" (para gerar apresentações adicionais a partir do mesmo estudo).

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/pages/agent/AgentNewPresentation.tsx` | Modificar — remover simulados, criar estudo de mercado junto com apresentacao |
| `src/pages/agent/NewMarketStudy.tsx` | Deletar |
| `src/pages/agent/MarketStudies.tsx` | Modificar — remover botao "Novo Estudo" |
| `src/App.tsx` | Modificar — remover rota `/market-studies/new` e lazy import |
| `src/components/AppSidebar.tsx` | Sem alteracao — link "Estudos de Mercado" aponta para listagem |

Nenhuma migracao de banco necessaria.

