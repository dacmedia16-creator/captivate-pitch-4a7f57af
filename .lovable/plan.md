

# Aumentar MAX_URLS de 25 para 40

## Alteração

### `supabase/functions/inngest-serve/index.ts`
Alterar a constante `MAX_URLS` de `25` para `40` (~linha 763).

## Risco
- Maior consumo de créditos Firecrawl por execução
- Possível timeout da edge function (~55s) se o scraping de 40 URLs demorar — monitorar nos logs

## Escopo
- 1 linha alterada, redeploy da edge function

