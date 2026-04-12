

# Fix: Foto Duplicada no about_regional

## Problema
No `about_regional`, `c.image_url` e `c.branch_photo_url` são renderizados simultaneamente. Quando ambos existem, aparecem duas fotos (frequentemente a mesma).

## Solução
Usar lógica de prioridade: exibir apenas **uma** imagem. Se `branch_photo_url` existir, usá-la como imagem principal no grid. Se não, usar `image_url`. Nunca exibir ambas.

## Arquivos a alterar

| Arquivo | Mudança |
|---|---|
| `src/components/layouts/LayoutExecutivo.tsx` | Linha ~336-340: Unificar `image_url` e `branch_photo_url` em uma única variável `displayImage = c.branch_photo_url \|\| c.image_url`. Renderizar apenas uma vez. |
| `src/components/layouts/LayoutPremium.tsx` | Mesma lógica. |
| `src/components/layouts/LayoutImpactoComercial.tsx` | Mesma lógica. |

## Lógica
```typescript
const displayImage = c.branch_photo_url || c.image_url;
// Renderizar displayImage uma única vez no grid (ao lado do texto)
// Remover a renderização separada de branch_photo_url abaixo
```

## Risco
Nenhum — apenas elimina duplicação visual. Apresentações sem fotos ou com apenas uma continuam inalteradas.

