

# Fase 4 — Exportação PDF + Transformar em Apresentação

## Escopo

Dois recursos no `MarketStudyResult.tsx`:
1. **Exportar PDF** — Edge function que gera HTML profissional do estudo e salva como arquivo
2. **Transformar em Apresentação** — Criar uma `presentation` com sections preenchidas a partir dos dados do estudo

## Implementação

### 1. Edge Function `export-market-study-pdf`
Arquivo: `supabase/functions/export-market-study-pdf/index.ts`

Segue o mesmo padrão do `export-pdf` existente (auth, ownership check, HTML generation, upload to storage).

Recebe `{ market_study_id }`. Busca study + subject + comparables + adjustments + results + branding. Gera HTML com:
- Capa com título, bairro, logo, data
- Seção "Imóvel Avaliado" com grid de atributos
- Métricas (preço médio, R$/m², sugestão anúncio, venda rápida)
- Faixa de preço visual (barra com marcadores)
- Resumo executivo e justificativa (se existirem)
- Tabela comparativa com preço original, ajustado, score, ajustes
- Rodapé com marca

Upload para `uploads/market-studies/{id}/{timestamp}.html` e retorna URL pública.

### 2. Botão "Transformar em Apresentação"
No `MarketStudyResult.tsx`, adicionar lógica que:
1. Cria um registro em `presentations` com dados do estudo
2. Cria `presentation_sections` com os dados do estudo:
   - `property_summary` — dados do imóvel avaliado
   - `pricing_scenarios` — cenários de preço (venda rápida, mercado, anúncio)
   - `market_analysis` — resumo executivo + justificativa
   - `comparables` — tabela resumida dos comparáveis
3. Navega para `/presentations/{id}/edit`

### 3. UI — Botões no header do resultado
Adicionar dois botões ao header do `MarketStudyResult.tsx`:
- `FileDown` — "Exportar PDF" (chama edge function, abre URL)
- `Presentation` — "Criar Apresentação" (cria e navega)

## Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/export-market-study-pdf/index.ts` | Criar |
| `src/pages/agent/MarketStudyResult.tsx` | Modificar — adicionar botões PDF + apresentação |

Nenhuma migração necessária — usa tabelas existentes (`presentations`, `presentation_sections`, `export_history`, storage `uploads`).

