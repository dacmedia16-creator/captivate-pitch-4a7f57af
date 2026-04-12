

# Corrigir proporção do logo no slide de capa

## Problema
O logo nos slides de capa usa apenas altura fixa (`h-16` / `h-14` / `h-18`) sem limitar a largura. Logos largos ficam desproporcionais. Apesar de ter `object-contain`, falta um `max-w` para conter logos muito horizontais.

## Solução
Adicionar `max-w-[200px]` (ou similar) nas tags `<img>` do logo nos 3 layouts de capa, garantindo que logos largos sejam redimensionados proporcionalmente.

### Arquivos modificados

1. **`src/components/layouts/LayoutExecutivo.tsx`** (linha 32)
   - Adicionar `max-w-[200px]` à classe do logo na cover

2. **`src/components/layouts/LayoutImpactoComercial.tsx`** (linha 27)
   - Mesmo ajuste

3. **`src/components/layouts/LayoutPremium.tsx`** (linha 28)
   - Mesmo ajuste

### Exemplo da mudança
```tsx
// Antes
<img src={c.logo_url} alt="" className="absolute top-14 left-16 h-16 object-contain drop-shadow-lg" />

// Depois
<img src={c.logo_url} alt="" className="absolute top-14 left-16 h-16 max-w-[200px] object-contain drop-shadow-lg" />
```

## Impacto
- Logos horizontais ficam contidos sem distorção
- Logos quadrados/verticais mantêm o tamanho atual
- Afeta os 3 layouts: Executivo, Premium e Impacto Comercial

