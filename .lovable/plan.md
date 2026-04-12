

# Exibir Foto da Agência nos Slides

## Problema

A foto da agência (`branch_photo_url`) está salva no banco de dados corretamente na seção `about_regional`, mas:
1. **LayoutPremium** e **LayoutImpactoComercial** — NÃO renderizam `branch_photo_url` no bloco genérico
2. **LayoutExecutivo** — renderiza, mas como imagem pequena (`max-h-48`)
3. Nenhum dos 3 layouts tem um bloco dedicado para `about_regional` — todos caem no fallback genérico

## Solução

Adicionar `{c.branch_photo_url && <img ...>}` no bloco genérico de **LayoutPremium** e **LayoutImpactoComercial**, e melhorar o tamanho da imagem nos 3 layouts para que fique visível e com boa apresentação.

## Arquivos a editar

### 1. `src/components/layouts/LayoutPremium.tsx` (generic, ~linha 204)
- Adicionar renderização de `c.branch_photo_url` após `c.text`

### 2. `src/components/layouts/LayoutImpactoComercial.tsx` (generic, ~linha 195)
- Adicionar renderização de `c.branch_photo_url` após `c.text`

### 3. `src/components/layouts/LayoutExecutivo.tsx` (linha 206)
- Aumentar tamanho da imagem de `max-h-48` para `max-h-64` com `rounded-lg`

Todas as adições seguem o mesmo padrão:
```tsx
{c.branch_photo_url && (
  <img src={c.branch_photo_url} alt="" className="max-h-64 object-cover w-full rounded-lg mt-4" />
)}
```

