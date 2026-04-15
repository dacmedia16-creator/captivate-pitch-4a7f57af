

# Fase 4: Migrar scraping para Inngest (Durable Execution)

## Arquitetura

```text
ANTES:
  Frontend → analyze-market-deep (edge function pesada, 1830 linhas)
           → EdgeRuntime.waitUntil() para background
           → polling market_studies.status

DEPOIS:
  Frontend → analyze-market-deep (edge function leve ~100 linhas)
           → valida inputs, rate limit, envia evento via Inngest Gateway
           → retorna 202

  Inngest → inngest-serve (edge function, SDK handler)
          → recebe evento "market-study/analyze.requested"
          → executa processMarketAnalysis() com retry nativo do Inngest
          → persiste dados, atualiza status

  Frontend → sem mudança (continua polling market_studies.status)
```

## O que muda

1. **`analyze-market-deep/index.ts`** — mantém validação, rate limiting, plan limits (Fases 1-2). Remove `processMarketAnalysis` e toda a lógica de scraping. Após validar, envia evento `market-study/analyze.requested` via gateway Inngest, retorna 202. Mantém fallback: se Inngest falhar ao enviar evento, executa inline (graceful degradation).

2. **`inngest-serve/index.ts`** (novo) — Edge function com o SDK `inngest/deno`. Exporta serve handler com uma função `market-study-analyze` que:
   - Recebe evento com `{ property, portals, filters, market_study_id, tenant_id }`
   - Contém toda a lógica atual de `processMarketAnalysis` (1400+ linhas movidas)
   - Retry nativo do Inngest (substitui `fetchWithRetry` parcialmente, mas mantém retry para Firecrawl)
   - Atualiza `market_studies.status` para `completed`/`failed`

3. **`supabase/config.toml`** — Adiciona bloco `[functions.inngest-serve]` com `verify_jwt = false` (Inngest precisa chamar sem JWT do usuário, usa signing key).

## Compatibilidade

- **Frontend**: Zero mudanças. Continua chamando `analyze-market-deep` e fazendo polling.
- **Fase 1 (Limites)**: Validação permanece em `analyze-market-deep` ANTES de enviar evento.
- **Fase 2 (Rate limit)**: Concurrency check permanece em `analyze-market-deep`.
- **Fase 3 (UI Execuções)**: `MarketStudyExecutions.tsx` sem mudança — lê mesmas tabelas.
- **Cascade Manus → Deep → Basic**: Sem mudança no frontend. Apenas `analyze-market-deep` que agora delega ao Inngest.

## Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/inngest-serve/index.ts` | Criar — SDK serve + função durável com toda a lógica de scraping |
| `supabase/functions/analyze-market-deep/index.ts` | Refatorar — manter validação/rate limit, enviar evento Inngest, fallback inline |
| `supabase/config.toml` | Adicionar `[functions.inngest-serve]` verify_jwt = false |

## Fluxo detalhado do evento

```text
analyze-market-deep:
  1. Valida inputs (property, portals)
  2. Verifica FIRECRAWL_API_KEY, LOVABLE_API_KEY
  3. Rate limit + plan limit (Fases 1-2)
  4. Incrementa usage
  5. POST https://connector-gateway.lovable.dev/inngest/e/
     Body: { name: "market-study/analyze.requested", data: { property, portals, filters, market_study_id, tenant_id } }
     Headers: Authorization: Bearer LOVABLE_API_KEY, X-Connection-Api-Key: INNGEST_API_KEY
  6. Se sucesso → 202
  7. Se falha → fallback: executa processMarketAnalysis inline (como hoje)

inngest-serve:
  - Inngest function "market-study-analyze"
  - Trigger: event "market-study/analyze.requested"
  - Retries: 2 (padrão Inngest)
  - Executa processMarketAnalysis com todos os dados do evento
```

## Riscos e mitigações

- **Inngest down**: Fallback inline no `analyze-market-deep` garante que o sistema continua funcionando
- **Edge function timeout**: Inngest tem timeout de 150s (vs 60s do edge function padrão) — mais margem
- **Signing key**: SDK valida automaticamente via `INNGEST_SIGNING_KEY` no env

## Sync com Inngest Dashboard

Após deploy, o endpoint `inngest-serve` precisa ser sincronizado com o Inngest:
- URL: `https://joqkvcyeypknbrlhizxb.supabase.co/functions/v1/inngest-serve`
- Acessar essa URL no browser ou fazer sync via dashboard do Inngest

