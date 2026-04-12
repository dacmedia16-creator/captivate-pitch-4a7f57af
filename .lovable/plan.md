

# Adicionar Upload de Imagem nos Slides Mundial, Nacional e Regional

## Problema
As abas "Mundial", "Nacional" e "Regional" na página Marca e Personalização só têm campo de texto. O usuário quer anexar uma imagem para cada uma, que será usada no slide correspondente da apresentação.

## Solução

### 1. Migração — Adicionar colunas na tabela `agency_profiles`
```sql
ALTER TABLE public.agency_profiles
  ADD COLUMN about_global_image_url text,
  ADD COLUMN about_national_image_url text,
  ADD COLUMN about_regional_image_url text;
```

### 2. `src/pages/company/CompanyBranding.tsx`
- Adicionar `about_global_image_url`, `about_national_image_url`, `about_regional_image_url` ao `agencyForm` state
- Adicionar `<ImageUploader>` em cada aba (Mundial, Nacional, Regional) abaixo do Textarea, com label "Imagem do slide"

### 3. `src/hooks/useGeneratePresentation.ts`
- Passar `image_url: agency?.about_global_image_url` no content de `about_global`
- Passar `image_url: agency?.about_national_image_url` no content de `about_national`
- Passar `image_url: agency?.about_regional_image_url` no content de `about_regional`

### 4. Layouts (3 arquivos)
No bloco genérico de cada layout, adicionar renderização de `c.image_url` (além do já existente `c.branch_photo_url`):
```tsx
{c.image_url && (
  <img src={c.image_url} alt="" className="max-h-64 object-cover w-full rounded-lg mt-4" />
)}
```

Arquivos: `LayoutExecutivo.tsx`, `LayoutPremium.tsx`, `LayoutImpactoComercial.tsx`

## Sem alterações em
- Rotas, autenticação, RLS (colunas text sem restrição especial)

