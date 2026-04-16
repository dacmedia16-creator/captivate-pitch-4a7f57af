

# Fix: Timeout na Fase de Scoring/Inserção do Inngest

## Problema
Após a extração AI (62 comparáveis), a edge function sofre timeout (`Http: connection closed before message completed`) **antes** de executar o `step.run("score-and-save")`. A função `scoreAndSave` faz tudo num único step: cleanup, scoring, insert comparables, insert adjustments, insert results, AI summary, sync presentations. Se o timeout ocorre entre steps, tudo se perde.

## Solução
Quebrar o monolítico `scoreAndSave` em **4 steps independentes** dentro do Inngest function handler (linhas 977-994). Cada step sobrevive ao timeout da edge function porque o Inngest re-invoca a função e pula steps já completados.

### Arquivo: `supabase/functions/inngest-serve/index.ts`

**Substituir linhas 977-994** (o bloco `score-and-save` único) por 4 steps:

1. **`step.run("score-filter")`** — Executa scoring de similaridade e filtragem dos comparáveis. Retorna `finalComparables` + `pricingAnalysis` + metadata. Sem I/O de banco.

2. **`step.run("db-insert-comparables")`** — Cleanup idempotente (delete old auto_firecrawl) + insert comparáveis + insert adjustments + update adjusted_price. Retorna IDs inseridos.

3. **`step.run("db-insert-results")`** — Insert `market_study_results` + chama `generate-market-summary` (AI summary, non-fatal). Marca estudo como `completed`.

4. **`step.run("sync-presentations")`** — Sincroniza pricing_scenarios nas presentations vinculadas. Non-fatal.

### Detalhes técnicos
- Cada step cria seu próprio `createClient(supabaseUrl, serviceKey)` (padrão já usado nos outros steps)
- Os dados entre steps são passados via return/variáveis locais (Inngest serializa entre invocações)
- A lógica de scoring (linhas 644-706) sai do `scoreAndSave` para uma função pura `scoreComparables()` sem I/O
- Manter `retries: 2` — agora cada step individual pode ser retentado

### Impacto
- Nenhuma mudança de schema ou frontend
- A lógica permanece idêntica, apenas distribuída em steps menores
- Cada step leva ~3-10s em vez de ~30s+ do monólito

