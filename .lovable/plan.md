

# Integrar Manus ao Estudo de Mercado

## Problema atual

Existem **dois fluxos desconectados**:
- **Wizard de Apresentação** (`AgentNewPresentation`) — chama Manus para buscar comparáveis reais nos portais, salva em `market_analysis_jobs` + `market_comparables` + `market_reports`, e injeta dados na apresentação.
- **Estudo de Mercado** (`NewMarketStudy`) — salva dados do imóvel em `market_studies` + `market_study_subject_properties`, mas NÃO chama Manus. Apenas tenta ler comparáveis que ainda não existem, resultando em estudo vazio.

O usuário quer que o Estudo de Mercado também use o Manus para buscar comparáveis reais nos portais configurados.

## Solução

### 1. Adicionar seleção de portais ao `SearchConfigForm`
O formulário de configuração de pesquisa do estudo de mercado não tem seleção de portais (diferente do wizard de apresentação). Adicionar a lista de portais habilitados do tenant com toggles, igual ao `StepMarketStudy` do wizard.

**Arquivo:** `src/components/market-study/SearchConfigForm.tsx`
- Adicionar campo `selectedPortals: string[]` ao `SearchConfigData`
- Buscar `tenant_portal_settings` com `portal_sources` habilitados
- Renderizar lista de portais com Switch para selecionar

### 2. Integrar Manus no fluxo de criação do estudo
Após criar o study e o subject property, chamar o Manus (com fallback para Firecrawl e depois simulados), salvar os comparáveis em `market_study_comparables`, e então rodar o motor de similaridade e ajustes.

**Arquivo:** `src/pages/agent/NewMarketStudy.tsx`
- Mapear `propertyData` para o formato que `analyze-market-manus` espera
- Montar lista de portais a partir dos IDs selecionados
- Chamar `supabase.functions.invoke("analyze-market-manus", ...)` com fallback para `analyze-market` e depois simulados
- Salvar resultados em `market_study_comparables` (em vez de `market_comparables`)
- Depois rodar `scoredComparables` + `calculateAllAdjustments` + `calculateMarketResult` como já faz
- Atualizar step de loading com mensagens de progresso (buscando portais, calculando...)

### 3. Opcionalmente vincular estudo à apresentação
Após o estudo ser concluído, o botão "Criar Apresentação" já existe no `MarketStudyResult.tsx`. Esse fluxo já funciona. Nenhuma alteração necessária aqui.

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/market-study/SearchConfigForm.tsx` | Modificar — adicionar seleção de portais |
| `src/pages/agent/NewMarketStudy.tsx` | Modificar — chamar Manus + fallbacks ao criar estudo |

Nenhuma migração de banco necessária — as tabelas e edge functions já existem.

