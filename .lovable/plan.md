

# Aumentar tipografia dos slides e alinhar com referencia visual RE/MAX

## Problema
As fontes dos slides ficaram muito pequenas apos a refatoracao. O ScaledSlide renderiza a 1920x1080 e escala para o container, mas os tamanhos de fonte nos temas estao pequenos demais (title: 28px, label: 10px, metric: 30px). As imagens de referencia mostram tipografia muito mais bold e grande -- titulos em 60-80px, metricas em 80-120px, labels em 16-20px.

## O que sera feito

### 1. Aumentar font sizes nos 3 temas
Ajustar os tokens de tipografia para proporcoes adequadas a 1920x1080:

| Token | Atual | Novo |
|-------|-------|------|
| `cover.titleSize` | 48px | 72px |
| `heading.titleSize` | 28px | 48px |
| `metric.size` | 30px | 64px |
| `metric.labelSize` | 10px | 16px |
| `divider.width` | 40px | 60px |

Arquivos: `theme-executivo.ts`, `theme-premium.ts`, `theme-impacto.ts`

### 2. Aumentar CSS base classes
No `index.css`, aumentar `.slide-label` de 10px para 16px, e ajustar `.slide-body` para proporcoes maiores.

### 3. Aumentar inline font sizes nos layouts
Nos 3 arquivos de layout, aumentar todos os `fontSize` inline:
- Broker intro: nome 42px -> 56px, bio 18px -> 24px, CRECI 14px -> 18px
- Property summary: titulo 36px -> 48px, highlights 17px -> 22px
- Closing: titulo 42px -> 56px, nome 28px -> 40px, contatos 17px -> 22px
- Generic sections: body text 15-17px -> 20-24px, card titles 18px -> 24px
- Stat bar numbers: 28px -> 48px
- Labels/badges: 12px -> 16px

Arquivos: `LayoutExecutivo.tsx`, `LayoutPremium.tsx`, `LayoutImpactoComercial.tsx`

### 4. Aumentar padding e espacamentos
Ajustar `p-14` e `gap` values para proporcoes corretas a 1920x1080 (p-16 a p-20, gaps maiores).

## Arquivos modificados
- `src/components/layouts/themes/theme-executivo.ts`
- `src/components/layouts/themes/theme-premium.ts`
- `src/components/layouts/themes/theme-impacto.ts`
- `src/components/layouts/LayoutExecutivo.tsx`
- `src/components/layouts/LayoutPremium.tsx`
- `src/components/layouts/LayoutImpactoComercial.tsx`
- `src/index.css`

## Risco
Nenhum. Apenas ajuste de tamanhos visuais, sem mudanca de logica.

