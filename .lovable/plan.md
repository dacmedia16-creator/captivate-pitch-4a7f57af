

# Garantir link do imóvel em todos os comparáveis

## Problema
A URL do anúncio depende da extração da IA, que pode falhar ou retornar vazio. O Firecrawl já retorna a URL real de cada resultado (`r.url`), mas ela não é usada como fallback.

## Solução
Na edge function `analyze-market/index.ts`, após a extração da IA, cruzar o `result_index` de cada comparável com o array `allSearchResults` para preencher `source_url` e `source_name` quando a IA não os extrair.

### Mudança no arquivo `supabase/functions/analyze-market/index.ts`

No bloco `.map()` (linhas 338-357), adicionar fallback:

```typescript
// Se a IA não extraiu URL, usar a URL do Firecrawl via result_index
const resultIdx = (c.result_index || 1) - 1;
const originalResult = allSearchResults[resultIdx];
const sourceUrl = c.source_url || originalResult?.url || "";
const sourceName = c.source_name || originalResult?.portal.name || "";
```

E usar `sourceUrl` / `sourceName` no retorno em vez de `c.source_url` / `c.source_name`.

## Impacto
- Todo comparável terá o link real do anúncio no portal
- O nome do portal será sempre preenchido
- Já aparece como link clicável na tabela de comparáveis

