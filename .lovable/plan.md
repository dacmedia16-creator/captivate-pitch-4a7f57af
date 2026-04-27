## Visão geral

Substituir todo o fluxo de **busca automática em portais** (Manus, Firecrawl, Google, scraping) por um **fluxo 100% manual** onde o corretor cola links dos comparáveis e revisa/preenche os dados à mão. A análise de preço passa a ser feita **somente sobre os dados que o usuário informou**.

A arquitetura existente (`market_studies`, `market_study_subject_properties`, `market_study_comparables`, `market_study_results`) será **reaproveitada** — não vamos criar tabelas novas; ela já cobre tudo o que o novo fluxo precisa. Apenas adicionamos colunas que faltam.

---

## 1. Banco de dados

### Migração (alterações de schema)

**Em `market_study_comparables`** — adicionar campos que o fluxo manual precisa e que não existem hoje:
- `condominium_fee numeric` (valor de condomínio)
- `iptu numeric`
- `bathrooms` já existe
- `notes text` (observações do corretor)
- `added_at timestamptz default now()` (data em que o link foi cadastrado — separada de `created_at` para clareza)
- `is_complete boolean generated always as (price is not null and area is not null and area > 0) stored` — destaca comparáveis incompletos

**Em `market_study_subject_properties`** — já tem todos os campos pedidos (purpose, type, address, area, quartos, suítes, banheiros, vagas, conservação, padrão, diferenciais, owner_expected_price, observations). Nada a fazer.

**Origem dos comparáveis**: a coluna `origin` já existe (`manual | auto_firecrawl | auto_manus`). Novos registros sempre `'manual'`.

### Limpeza (não destrutiva)

Não vamos dropar tabelas legadas (`market_analysis_jobs`, `market_comparables`, `market_reports`, `market_study_executions`, `market_study_raw_listings`) para preservar histórico. Apenas paramos de gravar nelas.

### RLS

Todas as tabelas envolvidas **já têm RLS por tenant/broker** (ver schema). Não precisamos criar políticas novas — o novo fluxo apenas insere/lê pelas mesmas regras.

---

## 2. Edge functions — desativar busca automática

Marcar como **deprecated** (retornam 410 Gone com mensagem clara) e parar de chamá-las do front:
- `analyze-market-deep`
- `analyze-market-manus`
- `analyze-market`
- `inngest-serve` (handler do pipeline Firecrawl)
- `batch-sync-market-slides` (se dependia do scraping)

**Mantemos ativas**:
- `generate-market-summary` — passa a receber só `subject + comparables manuais + cálculos` e gerar o relatório textual com IA (Lovable AI / Gemini). Sem chamadas a Firecrawl/Manus.
- `generate-presentation-text`, `export-pdf`, `export-market-study-pdf` — sem mudança funcional.

Secrets `FIRECRAWL_API_KEY`, `MANUS_API_KEY`, `INNGEST_*` deixam de ser necessários (mantemos no projeto, apenas não usados).

---

## 3. Front-end — novo wizard

### Nova página: `/market-studies/new` (`src/pages/agent/NewMarketStudy.tsx`)

Wizard de 5 etapas:

```text
[1 Imóvel avaliado] → [2 Links comparáveis] → [3 Revisão dos dados] → [4 Análise] → [5 Relatório IA]
```

**Etapa 1 — Imóvel avaliado**
Reaproveita `SubjectPropertyForm.tsx` (já existe e cobre todos os campos pedidos). Cria o `market_studies` (status=`draft`) + `market_study_subject_properties` ao avançar.

**Etapa 2 — Links dos comparáveis**
- Input "Cole o link do anúncio" + botão **Adicionar comparável**.
- Lista dos links já adicionados, cada item com: link, badge de portal detectado pela URL (vivareal/zap/olx/imovelweb/outro), botões **Revisar dados**, **Editar**, **Remover**.
- Cada "adicionar" cria uma linha em `market_study_comparables` com `origin='manual'`, `source_url`, `source_name` deduzido do domínio, e demais campos vazios → marcados como **incompletos**.

**Etapa 3 — Revisão dos dados de cada comparável**
Para cada comparável, modal/formulário com os campos pedidos:
- título, tipo, finalidade, bairro, cidade, metragem, quartos, suítes, banheiros, vagas, preço, condomínio, IPTU, conservação, observações.
- `price_per_sqm` calculado automaticamente (preço / metragem) e exibido em tempo real.
- Comparáveis incompletos ficam destacados em amarelo na lista.

**Etapa 4 — Análise**
Calculada **no cliente** a partir dos comparáveis com `price` e `area` válidos:
- quantidade usada / quantidade total (descartados aparecem listados)
- preço médio por m², mediana, mínimo, máximo
- faixa conservadora = mínimo … P25
- faixa média = P25 … P75
- faixa agressiva = P75 … máximo
- diff vs `owner_expected_price`
- **Alerta** se < 3 comparáveis válidos: "A análise pode ser pouco confiável porque há poucos imóveis comparáveis."
- Botão "Voltar e editar" + "Gerar relatório".
- Persiste em `market_study_results` (avg/median/min/max/suggested_*/justification).

**Etapa 5 — Relatório IA**
Botão **Gerar relatório com IA** chama `generate-market-summary` com payload:
```json
{ "subject": {...}, "comparables": [...], "calculations": {...} }
```
A função usa `google/gemini-2.5-flash` via Lovable AI Gateway e devolve markdown com:
posicionamento, faixa recomendada, justificativa, pontos fortes, pontos fracos, estratégia de anúncio, argumento comercial. Salvo em `market_study_results.executive_summary` + `justification`.

### Páginas alteradas

- **`MarketStudies.tsx`** (lista): botão "Nova análise" passa a ir para `/market-studies/new`. Remover handler `handleRetry` (não há mais retry de scraping). Texto da página: "Análises de mercado baseadas em comparáveis informados manualmente".
- **`MarketStudyResult.tsx`** (detalhe): remove indicadores de fase (`current_phase`, `collecting_urls`...), remove polling de processing — estudos novos nascem `completed`. Mantém visualização de comparáveis, gauge, scatter, insights, exportação PDF, "Criar apresentação".
- **`AgentNewPresentation.tsx`** (wizard de apresentação): remove `StepMarketStudy` (escolha de portais/filtros). A apresentação agora opcionalmente referencia uma análise já existente via dropdown "Vincular a uma análise de mercado" (busca em `market_studies` do broker).

### Páginas/componentes a remover (ou simplificar)

- `src/components/wizard/StepMarketStudy.tsx` — removido.
- `src/components/market-study/SearchConfigForm.tsx` — removido (configurava raio/portais).
- `src/pages/company/CompanyPortals.tsx` — manter só leitura ou remover do menu (não é mais usado para busca).
- `src/pages/agent/MarketStudyExecutions.tsx` — removido do menu (executions só faziam sentido com scraping).

### Hooks afetados

- `useMarketCalculations.ts` — estendido para retornar min/max/P25/P75 e as três faixas (conservadora/média/agressiva).
- `useMarketSimilarity.ts` / `useMarketAdjustments.ts` — mantidos (usuário ainda pode aprovar/desaprovar comparáveis e aplicar ajustes manuais opcionais).
- `syncMarketStudySections.ts` — mantido; já lê de `market_study_comparables` (que agora é populada manualmente).

---

## 4. Comunicação ao usuário (UI copy)

- Banner persistente na etapa 2: *"Esta análise é baseada em anúncios comparáveis que você informa manualmente. Não fazemos coleta automática em portais."*
- Toast ao adicionar link: *"Comparável adicionado. Revise os dados antes de gerar a análise."*

---

## 5. Resumo de entregáveis

**Telas criadas**
- `src/pages/agent/NewMarketStudy.tsx` — wizard 5 etapas
- `src/components/market-study/ComparableLinkInput.tsx` — input + lista de links
- `src/components/market-study/ComparableReviewForm.tsx` — formulário de revisão por comparável
- `src/components/market-study/ManualMarketAnalysis.tsx` — etapa 4 (cálculos)
- `src/components/market-study/AIReportPanel.tsx` — etapa 5

**Telas modificadas**
- `MarketStudies.tsx`, `MarketStudyResult.tsx`, `AgentNewPresentation.tsx`, `AppSidebar.tsx` (remover entradas de Executions/Portais)

**Telas/componentes removidos**
- `StepMarketStudy.tsx`, `SearchConfigForm.tsx`, `MarketStudyExecutions.tsx`

**Tabelas**
- `market_study_comparables` — adiciona `condominium_fee`, `iptu`, `notes`, `added_at`, `is_complete` (generated)
- Demais tabelas inalteradas
- RLS: nenhuma mudança (políticas existentes já cobrem)

**Edge functions**
- Depreciadas (410): `analyze-market-deep`, `analyze-market-manus`, `analyze-market`, `inngest-serve`
- Reescrita: `generate-market-summary` (recebe payload manual, sem scraping)
- Mantidas: `export-pdf`, `export-market-study-pdf`, `generate-presentation-text`

**Segurança**
- RLS por tenant/broker preservada (mesmas políticas das tabelas existentes)
- Validação Zod no edge function `generate-market-summary`
- Sem chamadas a APIs externas de scraping

**Como testar**
1. Login como corretor → menu **Estudos de Mercado** → **Nova análise**.
2. Etapa 1: preencher imóvel principal e avançar.
3. Etapa 2: colar 4 links de anúncios reais → confirmar que aparecem na lista com badge do portal e botão **Revisar**.
4. Etapa 3: abrir cada comparável e preencher preço + metragem (deixar 1 sem preço para testar destaque amarelo e exclusão dos cálculos).
5. Etapa 4: verificar contagem (3 usados / 4 totais), médias, faixas e diff vs preço pedido pelo proprietário; deixar só 2 comparáveis válidos → ver alerta de baixa confiabilidade.
6. Etapa 5: clicar **Gerar relatório com IA** → confirmar texto gerado e salvo.
7. Voltar para a lista → estudo aparece como **Concluído**.
8. Criar apresentação a partir do estudo → confirmar que a seção "Comparáveis de Mercado" usa os dados manuais com link clicável.