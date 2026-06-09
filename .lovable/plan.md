## Objetivo

Garantir que os parsers de `gecko-market-search` (preço, área, quartos, etc.) continuem funcionando ao longo do tempo, com testes Deno offline rodáveis via `supabase--test_edge_functions`.

## Mudanças

### 1. `supabase/functions/gecko-market-search/index.ts`

Adicionar `export` aos helpers (zero mudança de comportamento):
- `parseBRNumber`, `extractBedrooms`, `extractBathrooms`, `extractSuites`, `extractParking`, `extractArea`, `extractPrice`
- `parseFormattedAddress`, `detectPropertyType`, `typeMatches`
- `mapGeckoPdpToComparable`

### 2. Novo: `supabase/functions/gecko-market-search/index.test.ts`

Fixtures inline com 3 payloads reais da Gecko (já coletados dos logs) + 2 sintéticos com preço.

Suites (`Deno.test`):

- `parseBRNumber`: "1.250.000,00" → 1250000; "850000" → 850000; "" → null
- `extractBedrooms` / `extractBathrooms` / `extractSuites` / `extractParking` em textos PT-BR variados
- `extractArea`: "138 m²" → 138, "69 m2" → 69; ignora "5 m"
- `extractPrice`: "R$ 850.000" → 850000, "R$ 1.250.000,00" → 1250000, texto sem R$ → null
- `parseFormattedAddress("Rua X, 50 - Bairro, Cidade - UF")` → `{ neighborhood: "Bairro", city: "Cidade", state: "UF" }`
- `detectPropertyType`: "Apartamentos para venda..." → "Apartamento"; "Casa de Condomínio..." → "Casa de Condomínio"; "Casas..." → "Casa"
- `typeMatches`: ("Apartamento","Cobertura") true; ("Apartamento","Casa") false; ("Casa","Casa de Condomínio") true
- `mapGeckoPdpToComparable` nas 3 amostras reais:
  - Casa Cond. Jardim Santa Rosalia: bedrooms=3, area=138, suites=1, parking=2, type="Casa de Condomínio", city="Sorocaba", state="SP"
  - Casa Vila Trujillo: bedrooms=3, bathrooms=2, area=120, type="Casa", city="Sorocaba"
  - Apt Wanel Ville: bedrooms=3, area=69, type="Apartamento", city="Sorocaba"
- `mapGeckoPdpToComparable` em fixture sintético com `prices.price: 850000` → price=850000
- `mapGeckoPdpToComparable` em fixture sintético com descrição "R$ 1.250.000,00" → price=1250000

Sem imports externos além de `std/assert`. Não faz fetch.

## Como rodar

`supabase--test_edge_functions` com `{ functions: ["gecko-market-search"] }`.

## Arquivos afetados

- Editado: `supabase/functions/gecko-market-search/index.ts` (apenas `export` em helpers)
- Novo: `supabase/functions/gecko-market-search/index.test.ts`
