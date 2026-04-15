

# Excluir Kenlo do sistema

## O que será feito

Remover todas as referências ao portal Kenlo dos edge functions e desativar o registro no banco de dados.

## Mudanças

### 1. Migration — desativar Kenlo no banco
```sql
UPDATE public.portal_sources SET is_global = false WHERE code = 'kenlo';
DELETE FROM public.tenant_portal_settings WHERE portal_source_id = (SELECT id FROM public.portal_sources WHERE code = 'kenlo');
```

### 2. `supabase/functions/inngest-serve/index.ts`
- Remover `kenlo` do map `PORTAL_SITE_FILTERS` (linha 128)
- Remover case `"kenlo"` da função `portalTypeSlug` (linhas 169-172)
- Remover case `"kenlo"` da função `buildPortalUrl` (linhas 198-203)
- Remover `kenlo` dos `listingPatterns` (linhas 226 e 323)
- Remover todo o bloco de Kenlo extract schema e lógica especial (linhas 412-478)
- Remover referências `isKenlo` no scraping padrão (linhas 481-483)

### 3. `supabase/functions/analyze-market/index.ts`
- Remover `kenlo` do map de portais (linha 16)

### 4. `supabase/functions/analyze-market-manus/index.ts`
- Remover `kenlo` do map de portais (linha 44)

## Escopo
- 1 migration (desativar + limpar settings)
- 3 edge functions editadas
- ~80 linhas removidas

