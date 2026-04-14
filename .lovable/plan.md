

# Plano: Corrigir 3 bugs críticos no scraping multi-listing

## Diagnóstico dos logs

O teste revelou **3 bugs** que impediram a extração:

### Bug 1 — `looksLikeMultiListing` dispara em páginas individuais
A função verifica se há 3+ preços e 3+ áreas no markdown. Páginas individuais do VivaReal têm seções "imóveis similares" que contêm múltiplos preços/áreas, fazendo TODA página individual cair no fluxo multi-listing.

**Evidência**: Log mostra "Multi-listing sem URLs individuais" para TODAS as 25 URLs, incluindo `/imovel/` individuais.

### Bug 2 — `isMultiListingUrl` não exclui URLs individuais
O check `isMultiListingUrl` testa apenas padrões positivos (`/condominio/`, `?pagina=`), mas não exclui URLs que já são individuais (`/imovel/`). Na prática, uma URL individual vinda de expansão que tenha `?pagina=` na query string (raro, mas possível) seria tratada como multi-listing.

### Bug 3 — Busca genérica ignora o condomínio-alvo
A FASE 1A constrói URL genérica do bairro (`/venda/sp/sorocaba/parque-campolim/`). Nunca usa a URL do condomínio que o usuário queria. Os resultados do Google também são genéricos. Resultado: 25 imóveis de bairro genérico, muitos de cidades erradas (Rio de Janeiro apareceu nos logs), todos filtrados por similaridade < 40.

## Correções propostas

Todas em `supabase/functions/analyze-market-deep/index.ts`:

### Correção 1 — Proteger URLs individuais do fluxo multi-listing

```typescript
function isIndividualListingUrl(url: string): boolean {
  return /\/imovel\//i.test(url) || /\/propriedades\//i.test(url);
}
```

Na FASE 2 (linha 641), mudar de:
```
if (isMultiListing || looksLikeMultiListing(markdown))
```
para:
```
if (!isIndividualListingUrl(item.url) && (isMultiListing || looksLikeMultiListing(markdown)))
```

### Correção 2 — Priorizar condomínio na FASE 1A

Quando `property.condominium` existe, construir URL de condomínio do VivaReal como primeira URL nativa, junto com a URL genérica de bairro. Exemplo:
- URL condomínio: `vivareal.com.br/venda/sp/sorocaba/parque-campolim/?condominium=residencial-cannes`
- URL bairro: mantém a atual como fallback

Alternativamente, detectar se a busca de search do Google pode incluir o nome do condomínio na query.

### Correção 3 — Incluir nome do condomínio na query do Google (FASE 1B)

Na função `buildSearchQuery`, quando `property.condominium` existe, adicioná-lo à query:
```
"apartamento 2 quartos Residencial Cannes Parque Campolim Sorocaba venda site:vivareal.com.br"
```

Atualmente o condomínio **não aparece** na query.

### Correção 4 — Baixar threshold de similaridade para condomínios

Quando o comparável é do mesmo condomínio, dar score bônus garantido (já tem +25), mas também baixar o threshold mínimo de similaridade para 25 (em vez de 40) quando a busca é focada em condomínio. Isso evita descartar imóveis do mesmo prédio.

## Etapas

1. Adicionar `isIndividualListingUrl()` e usá-la como guard na FASE 2
2. Adicionar condomínio à query Google na `buildSearchQuery`
3. Na FASE 1A, quando condomínio existe, buscar URL com filtro de condomínio
4. Baixar minSimilarity para 25 quando preferSameCondominium=true
5. Deploy + teste com a URL do Cannes

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/analyze-market-deep/index.ts` | 4 correções pontuais |

## Riscos
- Nenhum risco estrutural. São fixes isolados de lógica.

