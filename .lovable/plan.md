

# Adicionar QuintoAndar como portal de pesquisa

## O que será feito

Adicionar o QuintoAndar como opção de portal nos 3 edge functions de pesquisa de mercado e inserir o registro na tabela `portal_sources`.

## Mudanças

### 1. Inserir registro no banco (via insert tool)
```sql
INSERT INTO public.portal_sources (name, code, base_url, is_global)
VALUES ('QuintoAndar', 'quintoandar', 'https://www.quintoandar.com.br', true);
```

### 2. `supabase/functions/inngest-serve/index.ts`
- Adicionar `quintoandar: "site:quintoandar.com.br"` ao `PORTAL_SITE_MAP` (linha 128)
- Adicionar case `"quintoandar"` em `buildPortalNativeUrl` para gerar URL nativa de busca
- Adicionar pattern `quintoandar: /quintoandar\.com\.br\/imovel\//` em `extractIndividualListingUrls` (linha 215)

### 3. `supabase/functions/analyze-market/index.ts`
- Adicionar `quintoandar: "site:quintoandar.com.br"` ao `PORTAL_SITE_MAP` (linha 15)

### 4. `supabase/functions/analyze-market-manus/index.ts`
- Já tem `quintoandar` no `PORTAL_URLS` (linha 43) — nenhuma mudança necessária

## Escopo
- 1 insert no banco (portal_sources)
- 2 edge functions editadas (~10 linhas adicionadas)
- QuintoAndar aparecerá automaticamente na tela de configuração de portais da imobiliária

