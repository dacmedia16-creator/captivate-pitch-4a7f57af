

# Slide Resultados com dados do perfil do corretor

## Resumo
Adicionar campos de portfólio e resultados pessoais ao perfil do corretor, e alimentar o slide "Resultados" com esses dados em vez de (ou além de) os dados genéricos do tenant.

## 1. Migration — Novos campos em `broker_profiles`

```sql
ALTER TABLE broker_profiles
  ADD COLUMN portfolio_images jsonb DEFAULT '[]',
  ADD COLUMN personal_results jsonb DEFAULT '[]',
  ADD COLUMN personal_testimonials jsonb DEFAULT '[]';
```

- `portfolio_images`: array de `{ image_url, caption? }` — fotos de imóveis vendidos
- `personal_results`: array de `{ title, metric_value, description? }` — conquistas pessoais (ex: "R$ 50M em vendas", "120 imóveis vendidos")
- `personal_testimonials`: array de `{ author_name, content }` — depoimentos sobre o corretor

## 2. AgentProfile.tsx — Formulário para preencher

Adicionar seção "Meus Resultados e Portfólio":
- **Fotos de portfólio**: grid de ImageUploader (até 6 fotos) com legenda opcional
- **Resultados pessoais**: lista editável de { título, valor métrico } (ex: "Vendas realizadas" → "120+")
- **Depoimentos pessoais**: lista editável de { autor, conteúdo }

## 3. Geração — Alimentar slide "results" com dados do corretor

Em `useGeneratePresentation.ts`, no case `"results"`:
```
content = {
  items: brokerProfile?.personal_results?.length > 0
    ? brokerProfile.personal_results
    : salesResults || [],
  testimonials: brokerProfile?.personal_testimonials?.length > 0
    ? brokerProfile.personal_testimonials
    : testimonials || [],
  portfolio_images: brokerProfile?.portfolio_images || [],
  broker_name: profile?.full_name,
  avatar_url: profile?.avatar_url,
};
```

Prioridade: dados do corretor > dados genéricos do tenant (fallback).

## 4. Layouts — Redesenhar slide "results"

Nos 3 layouts (Executivo, Premium, Impacto), adicionar:
- Foto do corretor + nome no topo ou lateral do slide
- Grid de fotos de portfólio (se houver)
- Métricas pessoais com destaque visual
- Depoimentos abaixo

## Arquivos

| Arquivo | Mudança |
|---------|---------|
| DB (migration) | 3 novos campos jsonb em broker_profiles |
| `src/pages/agent/AgentProfile.tsx` | Seção de portfólio, resultados e depoimentos |
| `src/hooks/useGeneratePresentation.ts` | Priorizar dados do corretor no slide results |
| `src/components/layouts/LayoutExecutivo.tsx` | Redesenhar results com foto + portfólio |
| `src/components/layouts/LayoutPremium.tsx` | Idem |
| `src/components/layouts/LayoutImpactoComercial.tsx` | Idem |

