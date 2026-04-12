

# Geração Automática de Comparáveis Simulados no Wizard

## Problema
Quando o wizard cria um `market_analysis_job` com portais selecionados, o job fica com status "pending" e sem comparáveis. O corretor precisa ir manualmente à página de estudo de mercado e encontra uma tabela vazia.

## Solução
Após criar o `market_analysis_job` no wizard, gerar automaticamente 6-10 comparáveis simulados (com preços, áreas, scores realistas baseados nos dados do imóvel), calcular o relatório de mercado, e atualizar o job para "completed". Também atualizar a section `pricing_scenarios` da apresentação com os cenários calculados.

## Mudanças

### 1. Criar helper `src/hooks/useSimulateComparables.ts`
Função pura que recebe os dados do imóvel (preço, área, bairro, quartos, vagas, tipo) e gera 6-10 comparáveis simulados com:
- Preços variando ±20% do preço esperado (ou baseado em área se preço não informado)
- Áreas variando ±30%
- Quartos/vagas similares (±1)
- Scores de similaridade (60-95%)
- Fontes aleatórias dos portais selecionados
- Títulos e bairros realistas

### 2. Atualizar `src/pages/agent/AgentNewPresentation.tsx`
Após inserir o `market_analysis_job`:
1. Gerar comparáveis simulados via helper
2. Inserir em `market_comparables`
3. Calcular cenários via `calculateMarketPrices`
4. Inserir `market_report`
5. Atualizar job status para "completed"
6. Atualizar section `pricing_scenarios` com cenários calculados

### 3. Atualizar `src/hooks/useGeneratePresentation.ts`
Na section `pricing_scenarios`, após gerar as sections, verificar se existe market_report e preencher os cenários reais (em vez de `null`).

## Arquivos
| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useSimulateComparables.ts` | Novo — gera comparáveis fictícios |
| `src/pages/agent/AgentNewPresentation.tsx` | Insere comparáveis + report + atualiza job |
| `src/hooks/useGeneratePresentation.ts` | Preenche pricing_scenarios com dados do report |

## Detalhes técnicos
- Comparáveis usam nomes de portais reais (ZAP, Viva Real, etc.) baseados nos `selectedPortals`
- Se `owner_expected_price` não informado, usa base de R$ 500.000
- Preço/m² calculado automaticamente
- `similarity_score` entre 60 e 95 distribuído aleatoriamente
- Endereços e títulos gerados com templates ("Apartamento 3 quartos - Bairro X")
