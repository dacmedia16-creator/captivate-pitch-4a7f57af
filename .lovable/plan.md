## Problema

A `gecko-market-search` está completando mas todos os comparáveis ficam com `price`, `area`, `bedrooms`, `bathrooms`, `neighborhood` em `null` → `market_study_results` zera.

Causa: o parser `next_flight` da Gecko para Zap devolve `prices: null`, `address: null` e nenhum campo numérico estruturado. Só vem `title`, `description`, `formattedAddress`, `businessType`, `listingId`, `url`.

Além disso, a busca trouxe casas e apartamento de 69m² para uma busca por "3 quartos" em Sorocaba — a Gecko ignora os filtros estruturados que mandamos no body PLP.

## Fix — `supabase/functions/gecko-market-search/index.ts`

### 1. Reescrever `mapGeckoPdpToComparable` para extrair do texto

Combinar `title + description + formattedAddress + url` em um único blob de texto e rodar regex:

- **bedrooms**: `/(\d+)\s*(quartos?|dorm|dormit[óo]rios?)/i`
- **bathrooms**: `/(\d+)\s*banheiros?/i`
- **suites**: `/(\d+)\s*su[íi]tes?/i`
- **parking_spots**: `/(\d+)\s*vagas?/i` ou `/(\d+)\s*garagem/i`
- **area**: `/(\d+(?:[.,]\d+)?)\s*m[²2]/i` — primeiro match
- **price**: tentar nesta ordem
  1. `description`: `/R\$\s*([\d.\,]+)/i`
  2. `title`: idem
  3. campo `d.prices?.price` / `d.prices?.main` se algum dia vier preenchido
  4. se ainda nulo, ler `__NEXT_DATA__` direto baixando a página: `fetch(url)` → regex `/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/` → JSON.parse → procurar `price` / `priceInfo.price` no objeto. Só se preço continuar nulo (fallback caro mas garante o número que faz tudo funcionar).
- **property_type**: heurística no `title` — se contém "Apartamento" → `Apartamento`; "Casa de Condomínio" → `Casa de Condomínio`; "Casa" → `Casa`; senão usa `d.contractType`.
- **neighborhood + city + state**: parsear `formattedAddress` com regex `/^(.+?)\s*-\s*(.+?),\s*(.+?)\s*-\s*([A-Z]{2})$/` (rua – bairro, cidade – UF).
- **address**: `formattedAddress` inteiro.
- **title**: `d.title` cru.
- **image_url**: `d.images[0]` se existir (hoje vem array vazio, mas deixar pronto).
- **external_id**: `d.listingId || d.listingExternalId`.

Encapsular em helpers puros (`extractBedrooms(text)`, `extractArea(text)`, `extractPrice(text)`) para ficar testável.

### 2. Filtrar comparáveis no lado do servidor

Após mapear cada PDP, **antes** de inserir, aplicar filtros do subject:

- **property_type** deve bater (Apartamento vs Casa). Match case-insensitive, com mapping curto: "Apartamento" só aceita títulos que começam com "Apartamento"; "Casa" aceita "Casa" e "Casa de Condomínio".
- **bedrooms**: aceitar `subject.bedrooms ± 1`.
- **city**: parsed da PLP, comparar com `subject.city` (normalizado, sem acento, lowercase).
- Se faltar `price` ou `area`, descartar (não entra na média e não é inserido).
- Cada rejeição é logada no console + gravada em `market_study_executions` (campo `notes`) para debug, mas a cascata continua.

Para compensar as rejeições, **buscar PLP em 2 páginas** (page 1 e 2 da Gecko) antes de iterar, montando a lista candidata de até 30 URLs e parando quando atingir `max_comparables` aprovados.

### 3. Phase messages mais úteis

- `"Buscando anúncios no Zap Imóveis (página 1/2)"`
- `"Avaliando anúncio X/N (Y aprovados)"`
- Ao final: se aprovados < 3, gravar `current_phase = "Concluído com poucos resultados (N anúncios)"` e ainda assim marcar `completed`.

### 4. Não mudar nada no frontend nem no schema

`NewMarketStudy.tsx` e `AgentNewPresentation.tsx` já fazem polling e leem a tabela. Como agora os campos `price/area/bedrooms` vão estar preenchidos, o resultado calcula corretamente sem mudanças de cliente.

## Arquivos afetados

- **Editado**: `supabase/functions/gecko-market-search/index.ts` (mapper, filtros, 2 páginas PLP, fallback `__NEXT_DATA__`).

## Teste

1. Mesma busca anterior (Sorocaba/SP, 3 quartos, Apartamento) deve trazer apenas apartamentos de 3±1 quartos com preço e área preenchidos.
2. `market_study_results` deve ter `avg_price_per_sqm > 0` e `confidence_level` não "low" se ≥5 aprovados.
3. Log do console da edge function deve mostrar rejeições com motivo (`"rejected: tipo Casa != Apartamento"`).
