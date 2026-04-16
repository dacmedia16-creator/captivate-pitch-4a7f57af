

# Aumentar Fotos nos Slides

## O que muda
Aumentar a altura das fotos em dois locais principais:

1. **SlideImageGrid** (slide property_summary): altura de `420px` para `520px`
2. **Portfolio no Results** (3 layouts): altura de `280px` para `360px`

## Arquivos alterados

### 1. `src/components/layouts/slide-components/SlideImageGrid.tsx`
- Aumentar `height: 420` para `height: 520` na imagem principal

### 2. `src/components/layouts/LayoutExecutivo.tsx`
- Portfolio images: `height: "280px"` para `height: "360px"`

### 3. `src/components/layouts/LayoutPremium.tsx`
- Portfolio images: `height: "280px"` para `height: "360px"`

### 4. `src/components/layouts/LayoutImpactoComercial.tsx`
- Portfolio images: `height: "280px"` para `height: "360px"`

## Impacto
- Apenas visual, sem mudanças de dados ou schema
- Fotos ficam mais visíveis e impactantes em todos os 3 temas

