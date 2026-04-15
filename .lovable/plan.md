

# Corrigir extração de anúncios do VIP Seven

## Problema
O Firecrawl retorna 21 links no array `links` para o VIP Seven, mas nenhum é `/imovel/XXXX`. O site é um SPA e os links dos imóveis ficam apenas no **markdown** (formato `](https://vipsevenimoveis.com.br/imovel/1051)`).

## Solução

### `supabase/functions/inngest-serve/index.ts`

**1. Alterar `extractIndividualListingUrls`** (linha 218) para aceitar `markdown` opcional e extrair URLs dele:

```typescript
function extractIndividualListingUrls(
  links: string[], portalCode: string, markdown?: string
): string[] {
  const listingPatterns: Record<string, RegExp> = { /* existente */ };
  const pattern = listingPatterns[portalCode];
  if (!pattern) return [];
  let allLinks = [...links];
  if (markdown) {
    const mdRegex = /\]\((https?:\/\/[^\s)]+)\)/g;
    let m;
    while ((m = mdRegex.exec(markdown)) !== null) allLinks.push(m[1]);
  }
  return [...new Set(allLinks.filter(l => pattern.test(l)))];
}
```

**2. Passar `markdown`** nas 2 chamadas existentes:
- Linha 431: `extractIndividualListingUrls(links, item.portal.code, markdown)`
- Linha 438 (paginação): `extractIndividualListingUrls(..., item.portal.code, pagMd)` — extrair markdown da resposta da paginação também

## Escopo
- 1 função alterada (~6 linhas adicionais)
- 2 call sites atualizados
- Redeploy da edge function

