

# Aumentar tamanho das letras nos slides

## Problema
Mesmo com os tamanhos atuais (72px cover, 48px headings, 64px metrics), as letras aparecem pequenas porque o slide de 1920x1080 e escalado para caber no container do editor. A solucao e aumentar ainda mais os tamanhos para que fiquem legiveis mesmo apos a reducao de escala.

## Mudancas propostas

### Novos tamanhos de fonte

| Elemento | Atual | Novo |
|----------|-------|------|
| Cover title | 72px | 84px |
| Heading title | 48px | 56px |
| Metric numbers | 64px | 72px |
| Slide label | 16px | 18px |
| Slide body | 22px | 26px |
| Broker name | 56px | 64px |
| Closing title | 56px | 64px |
| Closing broker | 40px | 48px |
| Card titles | 24px | 28px |
| Body/descriptions | 19-20px | 24px |
| Contact info | 22px | 26px |
| StatBar metrics | 48px | 56px |
| StatBar labels | 14px | 18px |
| Stats inline | 42px | 52px |
| CRECI | 18px | 22px |

### Arquivos modificados
1. **`src/index.css`** -- `.slide-label` 16px->18px, `.slide-body` 22px->26px
2. **`src/components/layouts/themes/theme-executivo.ts`** -- cover 84px, heading 56px, metric 72px, label 18px
3. **`src/components/layouts/themes/theme-premium.ts`** -- mesmos ajustes
4. **`src/components/layouts/themes/theme-impacto.ts`** -- mesmos ajustes
5. **`src/components/layouts/LayoutExecutivo.tsx`** -- todos os fontSize inline aumentados
6. **`src/components/layouts/LayoutPremium.tsx`** -- mesmos ajustes
7. **`src/components/layouts/LayoutImpactoComercial.tsx`** -- mesmos ajustes
8. **`src/components/layouts/slide-components/SlideStatBar.tsx`** -- metric 56px, label 18px
9. **`src/components/layouts/slide-components/SlideMetricRow.tsx`** -- defaults atualizados
10. **`src/components/layouts/slide-components/SlideScenarios.tsx`** -- defaults atualizados
11. **`src/components/layouts/slide-components/SlideItemList.tsx`** -- font sizes aumentados

## Risco
Nenhum. Apenas ajuste de tamanhos visuais.

