

# Diagnóstico: Estudo "Teste 10" travado — Edge Function timeout na FASE 2

## O que aconteceu

Os logs mostram claramente o problema:

1. A função inicia e executa FASE 1A (scraping nativo) + FASE 1B (Google search) com sucesso (~2s)
2. Chega na **FASE 2** ("Abrindo 64-65 URLs...") — que faz scraping individual de cada URL via Firecrawl
3. A Edge Function **morre por timeout** exatamente aos ~10 segundos (analytics mostram `execution_time_ms: ~10150` e status `206`)
4. O Inngest, recebendo 206 (parcial), **re-executa o mesmo step** — que recomeça do zero
5. Isso cria um **loop infinito**: boot → Fase 1 → Fase 2 → timeout → retry → boot → Fase 1 → ...

**Nunca chega na FASE 3** (extração IA), FASE 4 (scoring), ou FASE 5 (salvar no banco).

## Causa raiz

A função `marketStudyAnalyze` executa `processMarketAnalysis()` como **um bloco monolítico** — sem usar `step.run()` do Inngest. Todo o pipeline (scraping de ~25 URLs + IA + scoring + DB writes) roda numa única invocação da Edge Function, que tem limite de ~10s de wall-clock time.

## Solução: Quebrar em Inngest Steps

Refatorar o handler para usar `step.run()`, quebrando o trabalho em steps que cabem no tempo da Edge Function:

```text
Step 1: "collect-urls"     → Fase 1A + 1B (scraping de portais + Google)  ~3s
Step 2: "scrape-batch-N"   → Fase 2 em batches de 5 URLs cada           ~8s/batch
Step 3: "ai-extraction"    → Fase 3 (enviar para Gemini)                 ~5s
Step 4: "score-and-save"   → Fases 4+5 (scoring + DB inserts)            ~3s
```

Cada step retorna dados via Inngest (serializados entre invocações). Se um step falhar, apenas ele é retentado.

## Mudanças

### 1. `supabase/functions/inngest-serve/index.ts` — Refatorar handler (linhas 669-681)

Trocar a chamada monolítica por steps:

```typescript
const marketStudyAnalyze = inngest.createFunction(
  { id: "market-study-analyze", retries: 2, triggers: [{ event: "market-study/analyze.requested" }] },
  async ({ event, step }) => {
    const { property, portals, filters, market_study_id } = event.data;
    
    // Step 1: Collect URLs (Fase 1A + 1B)
    const urls = await step.run("collect-urls", async () => {
      // ... fase 1A + 1B logic, return mergedUrls
    });
    
    // Step 2: Scrape in batches of 5
    const allPages = [];
    for (let i = 0; i < urls.length; i += 5) {
      const batch = await step.run(`scrape-batch-${i}`, async () => {
        // scrape urls[i..i+5] via Firecrawl
      });
      allPages.push(...batch);
    }
    
    // Step 3: AI extraction
    const extracted = await step.run("ai-extraction", async () => {
      // call Gemini with allPages
    });
    
    // Step 4: Score, filter, save to DB
    await step.run("score-and-save", async () => {
      // scoring + insert comparables + results + update status
    });
  }
);
```

### 2. Extrair funções auxiliares do `processMarketAnalysis`

Dividir a função monolítica (~400 linhas) em funções menores reutilizáveis:
- `collectUrls(property, portals, filters, keys)` → retorna URLs + metadata
- `scrapeUrls(urls, firecrawlKey)` → retorna páginas scraped
- `extractWithAI(pages, property, lovableKey)` → retorna comparáveis
- `scoreAndSave(comparables, property, studyId, metadata)` → salva no DB

### 3. Corrigir estudo travado

- Marcar o estudo `05b1060c-9c42-4b4f-978c-3e61854e441d` como `failed` via migration
- Ou adicionar mecanismo de timeout automático

## Ação imediata (antes do refactor)

Marcar o estudo travado como `failed` para destravar a UI, já que ele está em loop infinito de retries no Inngest.

## Escopo

- 1 arquivo: `supabase/functions/inngest-serve/index.ts`
- 1 migration: marcar estudo travado como failed
- Sem mudanças no frontend
- Sem novas tabelas

