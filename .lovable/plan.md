

# Auditoria: Dados de Marca Não Usados nos Slides

## Problemas Encontrados

Após análise do fluxo `agency_profiles` → `useGeneratePresentation` → layouts, identifiquei **3 problemas**:

### 1. `regional_numbers` nunca é renderizado nos slides
O campo é salvo corretamente no content da seção `about_regional` (ex: `"500+ imóveis vendidos | R$ 2bi em VGV | 15 anos de mercado"`), mas **nenhum dos 3 layouts** renderiza `c.regional_numbers`. O dado existe no JSON mas é ignorado na renderização.

### 2. Apresentações antigas não têm `image_url` nas seções about_*
O código de geração (`useGeneratePresentation.ts`) foi corrigido recentemente para incluir `image_url` (linhas 79-85), mas todas as apresentações já geradas **não possuem esse campo** no content JSON. Confirmado no banco: as seções `about_global` e `about_national` têm apenas `logo_url` + `text`, sem `image_url`.

### 3. `about_regional` não inclui `image_url` nas apresentações antigas
Mesmo problema — o campo `about_regional_image_url` foi adicionado depois e não está no content das apresentações existentes.

## Plano de Correção

### 1. Adicionar renderização de `regional_numbers` nos 3 layouts
Nos blocos genéricos (que renderizam `about_regional`), adicionar após `c.text`:
```tsx
{c.regional_numbers && (
  <div className="flex flex-wrap gap-6 mt-4">
    {c.regional_numbers.split("|").map((item, i) => (
      <div key={i} className="text-center">
        <p className="font-bold text-lg" style={{ color: primary }}>{item.trim()}</p>
      </div>
    ))}
  </div>
)}
```
**Arquivos**: `LayoutExecutivo.tsx`, `LayoutPremium.tsx`, `LayoutImpactoComercial.tsx`

### 2. Corrigir apresentações existentes (sem regenerar)
Criar um script/migração SQL que atualiza o content JSON das seções `about_global`, `about_national` e `about_regional` existentes, injetando os campos `image_url` a partir da tabela `agency_profiles` do mesmo tenant.

```sql
UPDATE presentation_sections ps
SET content = ps.content || jsonb_build_object('image_url', ap.about_global_image_url)
FROM presentations p, agency_profiles ap
WHERE ps.presentation_id = p.id
  AND ap.tenant_id = p.tenant_id
  AND ps.section_key = 'about_global'
  AND ap.about_global_image_url IS NOT NULL
  AND (ps.content->>'image_url') IS NULL;
```
(Repetir para `about_national` e `about_regional`)

### 3. Sem outras alterações
- Geração de **novas** apresentações já inclui `image_url` corretamente
- `branch_photo_url` já funciona no `about_regional`
- `logo_url`, `company_name`, cores — tudo OK
- Não alterar RLS, auth ou lógica de negócio

## Arquivos a editar
1. `src/components/layouts/LayoutExecutivo.tsx` — adicionar `regional_numbers`
2. `src/components/layouts/LayoutPremium.tsx` — adicionar `regional_numbers`
3. `src/components/layouts/LayoutImpactoComercial.tsx` — adicionar `regional_numbers`
4. Migração SQL — backfill `image_url` nas seções existentes

