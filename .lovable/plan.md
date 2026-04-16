

# Melhorar Slide de Resultados

## O que muda
Redesenhar o slide "Resultados" nos 3 layouts para ficar mais parecido com a referência: métrica principal em destaque (card com fundo claro), fotos do portfólio em grid horizontal com overlay de legenda/badge, e avatar+nome do corretor no topo.

## Mudanças por arquivo

### 1. `src/components/layouts/LayoutExecutivo.tsx` — Seção `results` (linhas 435-478)
- Avatar + nome do corretor no topo com estilo atual (já existe, manter)
- **Métricas**: exibir o primeiro item como card hero centralizado (fonte grande, cor accent), e os demais como row secundária abaixo
- **Portfólio**: cards com overlay escuro na parte inferior mostrando caption (ex: "VENDIDO em 15 dias") e tipo do imóvel, estilo similar à imagem de referência — 4 cards lado a lado, `h-[200px]`, `rounded-lg`, com gradiente overlay
- **Depoimento**: manter abaixo como está

### 2. `src/components/layouts/LayoutPremium.tsx` — Seção `results`
- Mesma lógica adaptada ao tema premium (fundo escuro)

### 3. `src/components/layouts/LayoutImpactoComercial.tsx` — Seção `results`
- Mesma lógica adaptada ao tema impacto

### 4. Nenhuma mudança em dados/geração
Os dados (`personal_results`, `portfolio_images` com `caption`) já estão sendo passados corretamente no `useGeneratePresentation.ts`.

## Detalhes do layout hero metric

```text
┌─────────────────────────────────────────────┐
│ RESULTADOS                                  │
│ Resultados                                  │
│ ───                                         │
│ [avatar] Carlos Lima                        │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │     60 Milhões Vencidos                 │ │
│ │           + 200                          │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [img1 overlay] [img2 overlay] [img3] [img4] │
│                                             │
│ "Depoimento..."  — Autor                    │
└─────────────────────────────────────────────┘
```

## Detalhes do overlay nas imagens de portfólio
Cada imagem terá um gradiente `linear-gradient(transparent 40%, rgba(0,0,0,0.7))` na parte inferior, com a caption em branco (`font-bold`, `text-sm` no contexto do slide = ~20px).

