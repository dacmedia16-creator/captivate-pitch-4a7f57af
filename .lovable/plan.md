

# Enriquecer slide de Estudo de Mercado com todos os detalhes

## Problema atual
1. **O slide de estudo de mercado nunca aparece** — o layout checa `c.comparables?.length > 0`, mas o conteúdo gerado não inclui o array `comparables` (só `comparables_count`).
2. **Dados insuficientes** — não inclui informações do imóvel avaliado (estado de conservação, idade, padrão construtivo, diferenciais) nem detalhes dos comparáveis.
3. **Apresentações existentes** — o `syncMarketStudySections` também não inclui esses dados, então nenhuma apresentação existente mostra o estudo.

## Plano

### 1. Enriquecer o conteúdo da seção `market_study_placeholder`

**Arquivos**: `src/hooks/useGeneratePresentation.ts` e `src/hooks/syncMarketStudySections.ts`

Adicionar ao conteúdo:
- **Subject property completo** (buscando de `market_study_subject_properties`): tipo, padrão, conservação, idade, área, quartos, diferenciais, condomínio, bairro, cidade, preço pretendido
- **Array de comparáveis aprovados** com: título, preço, área, quartos, suítes, vagas, banheiros, condomínio, bairro, conservation_state, construction_standard, similarity_score, adjusted_price, price_per_sqm, differentials
- **Preço pretendido do proprietário** (`owner_expected_price`)

No `syncMarketStudySections`, buscar `market_study_subject_properties` e incluir os mesmos dados para que atualizações de estudo reflitam nas apresentações.

### 2. Corrigir condição de render nos 3 layouts

**Arquivos**: `LayoutExecutivo.tsx`, `LayoutPremium.tsx`, `LayoutImpactoComercial.tsx`

Mudar a condição de:
```
c.comparables?.length > 0
```
Para:
```
c.status === "completed"
```

### 3. Redesenhar o slide de estudo de mercado (3 layouts)

O slide passará a mostrar:

**Bloco superior — Imóvel Avaliado:**
- Tipo, padrão construtivo, estado de conservação, idade
- Área, quartos, suítes, vagas, banheiros
- Diferenciais do imóvel

**Bloco central — Estatísticas do Mercado:**
- Métricas (preço médio, mediana, R$/m², nº comparáveis) — já existente via `MarketStats`
- Gráfico de barras com preços dos comparáveis — já existente via `MarketPriceBarChart`

**Bloco inferior — Tabela resumida de comparáveis:**
- Lista compacta com título, preço, área, quartos, score de similaridade

### 4. Atualizar apresentações existentes

Criar uma migration ou script que, para cada apresentação com `market_study_id`, re-sincronize a seção `market_study_placeholder` com os dados completos. Isso será feito chamando o `syncMarketStudySections` atualizado via um RPC ou edge function de migração.

Alternativa mais simples: adicionar ao frontend um efeito que, ao abrir o editor, detecta se a seção está com `status: "pending"` mas o estudo já está `completed`, e dispara o sync automaticamente.

## Arquivos alterados

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/useGeneratePresentation.ts` | Buscar subject_properties + incluir comparáveis e dados completos na seção |
| `src/hooks/syncMarketStudySections.ts` | Incluir subject_property, comparáveis, e todos os detalhes na sincronização |
| `src/components/layouts/LayoutExecutivo.tsx` | Redesenhar slide market_study com seção de imóvel avaliado + tabela de comparáveis |
| `src/components/layouts/LayoutPremium.tsx` | Mesmo redesenho adaptado ao tema premium |
| `src/components/layouts/LayoutImpactoComercial.tsx` | Mesmo redesenho adaptado ao tema impacto |
| `src/pages/agent/PresentationEditor.tsx` | Auto-sync: ao abrir, se seção está pending mas estudo completed, disparar sync |

