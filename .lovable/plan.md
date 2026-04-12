

# Wizard, Apresentação e Editor — Listing Studio AI

## Resumo

Implementar o núcleo do produto: dashboard do corretor funcional, wizard multi-step para criação de apresentações, 3 layouts visuais premium, geração automática de seções, editor com sidebar/preview/painel, modo apresentação fullscreen, e sistema de modelos.

## Escopo de Implementação

### 1. Dashboard do Corretor (`AgentDashboard.tsx`)
- MetricCards: total apresentações, apresentações no mês, PDFs gerados, estudos recentes, modelos salvos
- Botão "Nova Apresentação" com destaque visual
- 3 listas: apresentações recentes, rascunhos, modelos salvos
- Queries via `@tanstack/react-query` filtradas por `broker_id = auth.uid()`

### 2. Wizard de Nova Apresentação (`AgentNewPresentation.tsx`)
Fluxo em 4 etapas com stepper visual e navegação anterior/próximo:

**Etapa 1 — Dados do Imóvel**: Formulário completo com todos os campos (nome, proprietário, tipo, finalidade, endereço, áreas, cômodos, padrão, idade, diferenciais, valor pretendido, observações) + upload de fotos múltiplas via ImageUploader para `presentation_images`

**Etapa 2 — Layout e Estilo**: Seleção visual de layout (Executivo/Premium/Impacto Comercial), tom (técnico/executivo/premium/comercial), e modo (automático/guiado/avançado) com cards de preview

**Etapa 3 — Estudo de Mercado**: Seleção de portais (via `tenant_portal_settings`), raio de busca, faixas de metragem/preço, número de comparáveis. Salva configuração em `market_analysis_jobs`

**Etapa 4 — Geração**: Animação de loading com 4 etapas visuais progressivas. Ao finalizar, salva a apresentação e gera as seções automaticamente

### 3. Geração Automática de Seções
Ao concluir o wizard, uma função client-side:
- Busca `broker_profiles`, `agency_profiles`, `marketing_actions`, `competitive_differentials`, `sales_results`, `testimonials` do tenant
- Monta 12 seções automáticas em `presentation_sections` com `section_key`:
  - `cover`, `broker_intro`, `about_global`, `about_national`, `about_regional`, `property_summary`, `marketing_plan`, `differentials`, `results`, `market_study_placeholder`, `pricing_scenarios`, `closing`
- Cada seção tem `content` JSONB com dados estruturados e `sort_order`

### 4. Três Layouts Visuais Premium
Criar componentes de renderização em `src/components/layouts/`:
- **LayoutExecutivo**: Clean, corporativo, fundo claro, tipografia sóbria, gráficos lineares
- **LayoutPremium**: Elegante, grandes imagens, fundo escuro/dourado, visual de alto padrão
- **LayoutImpactoComercial**: Energia comercial, foco em métricas e prova social, cores vibrantes

Cada layout renderiza as 12 seções com estilo diferente mas mesma estrutura de dados. Todos respeitam `primary_color`/`secondary_color` do branding.

### 5. Editor da Apresentação (`/presentations/:id/edit`)
Página com 3 áreas:
- **Sidebar esquerda**: Lista de slides/seções com thumbnails, drag-and-drop para reordenar, toggle de visibilidade
- **Preview central**: Renderização do slide selecionado no layout escolhido
- **Painel direito**: Formulário de edição do conteúdo da seção selecionada (textos, imagens)

Ações no toolbar: duplicar apresentação, salvar como modelo, abrir modo apresentação, exportar PDF (placeholder), gerar link compartilhável (via `share_token`)

### 6. Modo Apresentação (`/presentations/:id/present`)
Tela fullscreen sem sidebar/topbar:
- Navegação anterior/próximo via botões e teclas de seta
- Barra de progresso sutil
- Botão fullscreen nativo
- Renderiza cada seção visível no layout selecionado

### 7. Modelos (`AgentPresentations.tsx`)
- Tab "Modelos" na lista de apresentações
- Ação "Salvar como modelo" no editor → insere em `presentation_templates` com `structure` JSONB contendo as seções
- Ação "Usar modelo" → cria nova apresentação a partir do template

## Novas Rotas

| Rota | Componente |
|------|-----------|
| `/presentations/:id/edit` | PresentationEditor |
| `/presentations/:id/present` | PresentationMode |

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/agent/AgentDashboard.tsx` | Dashboard funcional (reescrever) |
| `src/pages/agent/AgentNewPresentation.tsx` | Wizard 4 etapas (reescrever) |
| `src/pages/agent/AgentPresentations.tsx` | Lista + modelos (reescrever) |
| `src/pages/agent/PresentationEditor.tsx` | Editor 3 painéis |
| `src/pages/agent/PresentationMode.tsx` | Modo apresentação fullscreen |
| `src/components/wizard/WizardStepper.tsx` | Stepper visual |
| `src/components/wizard/StepPropertyData.tsx` | Etapa 1 — Dados do imóvel |
| `src/components/wizard/StepLayoutStyle.tsx` | Etapa 2 — Layout e estilo |
| `src/components/wizard/StepMarketStudy.tsx` | Etapa 3 — Estudo de mercado |
| `src/components/wizard/StepGeneration.tsx` | Etapa 4 — Geração |
| `src/components/layouts/LayoutExecutivo.tsx` | Layout executivo |
| `src/components/layouts/LayoutPremium.tsx` | Layout premium |
| `src/components/layouts/LayoutImpactoComercial.tsx` | Layout impacto |
| `src/components/layouts/SectionRenderer.tsx` | Renderizador de seção por layout |
| `src/components/editor/SlidesSidebar.tsx` | Sidebar de slides |
| `src/components/editor/EditPanel.tsx` | Painel de edição |
| `src/components/editor/EditorToolbar.tsx` | Toolbar do editor |
| `src/hooks/useGeneratePresentation.ts` | Hook para gerar seções automáticas |
| `src/App.tsx` | Adicionar rotas do editor e modo apresentação |

## Detalhes Técnicos

- Formulários com `react-hook-form` + `zod`
- Upload de múltiplas fotos via `supabase.storage.from('uploads')`
- Geração de `share_token` com `crypto.randomUUID()`
- Estado do wizard gerenciado com `useState` local (dados temporários até salvar)
- Queries com `useQuery`/`useMutation` para todas as operações CRUD
- Layout selection via cards clicáveis com preview visual
- Editor usa `useParams` para carregar apresentação por ID
- Modo apresentação filtra `presentation_sections` onde `is_visible = true` e ordena por `sort_order`

