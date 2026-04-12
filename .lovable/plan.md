

# Estudo de Mercado, IA, PDF e Link Compartilhavel

## Resumo

Implementar o modulo de estudo de mercado com comparaveis, calculos automaticos e cenarios de preco; integrar IA via Lovable AI para gerar textos da apresentacao; criar exportacao PDF server-side; implementar rota publica de compartilhamento; e adicionar audit logs.

## Etapas

### 1. Pagina de Estudo de Mercado (`AgentMarketStudy.tsx` reescrita + novo `MarketStudyDetail.tsx`)

- **Listagem**: Reescrever `AgentMarketStudy.tsx` com lista de estudos de mercado do corretor (via `market_analysis_jobs`)
- **Detalhe** (`/market-study/:id`): Nova pagina com:
  - Resumo do imovel (dados da presentation vinculada)
  - Filtros usados e portais selecionados
  - Tabela de comparaveis (`market_comparables`) com score, preco, preco/m2, area, quartos, vagas, imagem, fonte, botoes aprovar/remover
  - Cards dos 3 cenarios de preco (aspiracional, mercado, venda rapida) com visual premium
  - Botao para adicionar comparaveis manualmente
  - Calculos automaticos que geram/atualizam `market_reports`

### 2. Calculos Automaticos

Funcao client-side que, a partir dos comparaveis aprovados (`is_approved = true`):
- Calcula media/mediana de preco, media de preco/m2
- Cenario mercado = mediana
- Cenario aspiracional = mediana * 1.15
- Cenario venda rapida = mediana * 0.85
- Salva em `market_reports` e atualiza `pricing_scenarios` na presentation_section correspondente

### 3. Integracao IA via Lovable AI

- **Edge function `generate-presentation-text`**: Recebe dados do imovel, branding, comparaveis aprovados, tom e layout. Usa Lovable AI (google/gemini-3-flash-preview) para gerar:
  - Resumo do imovel enriquecido
  - Perfil de comprador ideal
  - Analise do mercado
  - Justificativa de preco
  - Explicacao dos 3 cenarios
  - Texto de fechamento comercial
- Botao "Gerar textos com IA" no editor que chama a edge function e atualiza as sections
- Streaming nao necessario aqui (invoke simples, resultado JSONB)

### 4. Exportacao PDF

- **Edge function `export-pdf`**: Gera PDF server-side usando a biblioteca `jspdf` ou HTML-to-PDF
  - Recebe presentation_id, busca sections e branding
  - Gera PDF com paginacao, imagens e layout premium
  - Salva no bucket `uploads` e registra em `export_history`
  - Retorna URL do arquivo
- Botao "Exportar PDF" no `EditorToolbar` chama a edge function

### 5. Link Compartilhavel

- **Rota publica** `/share/:token` sem autenticacao
- Nova pagina `SharedPresentation.tsx` que:
  - Busca presentation por `share_token` (precisa policy RLS para acesso anonimo)
  - Renderiza todas as sections visiveis no layout correto com branding
  - Modo read-only, visual premium
- **Migracao**: Adicionar RLS policy na `presentations` e `presentation_sections` para permitir SELECT anonimo quando acessado via share_token
- Botao "Gerar Link" no editor gera UUID e salva em `share_token`

### 6. Audit Logs

- Funcao utilitaria `logAudit(action, entityType, entityId, metadata?)` que insere em `audit_logs`
- Adicionar RLS policy para INSERT por usuarios autenticados em `audit_logs`
- Chamar em: criacao de apresentacao, geracao de estudo, exportacao PDF, geracao de link, edicao/save da apresentacao

### 7. Seed Demo

- Migracao com INSERT de dados demo:
  - 1 apresentacao pronta com status "generated"
  - 1 market_analysis_job com status "completed"
  - 5-8 market_comparables ficticios
  - 1 market_report com cenarios calculados
  - 1 export_history

## Migracao SQL necessaria

```text
- RLS policy em presentations: anon SELECT WHERE share_token = token do request
- RLS policy em presentation_sections: anon SELECT via presentation com share_token
- RLS policy em agency_profiles: anon SELECT via tenant_id de presentation compartilhada
- RLS policy em audit_logs: INSERT para authenticated
- Funcao SQL para lookup por share_token (SECURITY DEFINER)
```

## Edge Functions a criar

| Funcao | Descricao |
|--------|-----------|
| `generate-presentation-text` | Gera textos com IA usando Lovable AI |
| `export-pdf` | Gera PDF e salva no storage |

## Arquivos a criar/modificar

| Arquivo | Acao |
|---------|------|
| `src/pages/agent/AgentMarketStudy.tsx` | Reescrever (listagem) |
| `src/pages/agent/MarketStudyDetail.tsx` | Criar (detalhe do estudo) |
| `src/pages/shared/SharedPresentation.tsx` | Criar (rota publica) |
| `src/hooks/useMarketCalculations.ts` | Criar (calculos automaticos) |
| `src/hooks/useAuditLog.ts` | Criar (funcao utilitaria) |
| `supabase/functions/generate-presentation-text/index.ts` | Criar |
| `supabase/functions/export-pdf/index.ts` | Criar |
| `src/components/editor/EditorToolbar.tsx` | Atualizar (PDF + IA) |
| `src/pages/agent/PresentationEditor.tsx` | Atualizar (botao IA) |
| `src/App.tsx` | Adicionar rotas `/market-study/:id` e `/share/:token` |
| Migracao SQL | RLS anonimo + audit INSERT policy |

## Detalhes tecnicos

- IA: Lovable AI Gateway via edge function, modelo `google/gemini-3-flash-preview`, tool calling para structured output (sections JSONB)
- PDF: Edge function Deno com construcao HTML + renderizacao. Alternativa: gerar HTML das sections e converter
- Share: Funcao SECURITY DEFINER `get_shared_presentation(token)` que retorna dados sem autenticacao
- Calculos: Funcao pura no frontend, resultado salvo via mutation em `market_reports`

