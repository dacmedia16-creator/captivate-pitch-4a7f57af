

# Redesign dos Slides — Branding RE/MAX + Tipografia Gotham

## Templates identificados no projeto

| Template | Arquivo | Linhas |
|----------|---------|--------|
| **Executivo** | `src/components/layouts/LayoutExecutivo.tsx` | 263 linhas |
| **Premium** | `src/components/layouts/LayoutPremium.tsx` | 235 linhas |
| **Impacto Comercial** | `src/components/layouts/LayoutImpactoComercial.tsx` | 240 linhas |

Cada template renderiza os mesmos section_keys (`cover`, `broker_intro`, `property_summary`, `market_study_placeholder`, `pricing_scenarios`, `closing`, genéricos) com estilos distintos. A interface `Props` com `branding` (primary_color, secondary_color, logo_url) é mantida.

## Gotham — Limitação técnica e solução

Gotham é uma fonte **comercial licenciada** (Hoefler&Co). Não está disponível no Google Fonts. Soluções:

- **Fallback imediato**: usar `"Montserrat"` do Google Fonts — é a alternativa gratuita mais próxima de Gotham (geométrica, moderna, excelente hierarquia de pesos).
- **Estrutura preparada**: todas as referências tipográficas serão declaradas como `font-family: 'Gotham', 'Montserrat', sans-serif`. Se o cliente fornecer os arquivos .woff2 de Gotham no futuro, basta adicioná-los via `@font-face` e tudo funciona automaticamente.

## Paleta RE/MAX nos slides

| Uso | Cor | Hex |
|-----|-----|-----|
| Base institucional, fundos escuros, títulos | Azul RE/MAX | `#003DA5` |
| Destaques, CTAs, barras de acento, badges | Vermelho RE/MAX | `#DC1431` |
| Fundos claros, texto sobre escuro, respiro | Branco/Neutro | `#FFFFFF` / `#F5F6F8` |
| Texto secundário, labels | Cinza neutro | `#6B7280` / `#9CA3AF` |

**Distribuição por tipo de slide:**
- **Tipo 1 (Impacto)**: fundo azul escuro com overlay, vermelho como barra de acento lateral, títulos brancos
- **Tipo 2 (Conteúdo)**: fundo branco/neutro claro, azul nos títulos e numerações, vermelho em métricas de destaque e separadores
- **Tipo 3 (Fechamento)**: fundo azul escuro, vermelho em nome/CTA, branco no texto

## Hierarquia tipográfica Gotham/Montserrat

| Elemento | Peso | Tamanho | Tracking |
|----------|------|---------|----------|
| `.slide-title` | 800 (Black) | 44-56px | -0.03em |
| `.slide-metric` | 700 (Bold) | 28-48px | -0.02em |
| `.slide-label` | 600 (SemiBold) | 10-11px | 0.20em, uppercase |
| `.slide-body` | 400 (Regular) | 14-15px | normal |

Nota: Playfair Display será **removida** dos slides (permanece na UI geral se desejado). Gotham/Montserrat é geométrica sans-serif — o oposto de Playfair serif.

## Mudanças por arquivo

### `index.html`
- Adicionar import do Google Fonts Montserrat (wght 400;500;600;700;800)

### `src/index.css`
- Substituir Playfair Display por `'Gotham', 'Montserrat'` nas classes `.slide-title`, `.slide-metric`
- Manter `.slide-label` e `.slide-body` em `'Gotham', 'Montserrat'` (tudo na mesma família agora)
- Atualizar `.editorial-divider` com cor vermelha RE/MAX

### `src/components/layouts/LayoutExecutivo.tsx`
- Rewrite completo: paleta azul/vermelho/branco RE/MAX
- Cover: fundo azul com overlay, barra vermelha vertical, título Gotham Black branco
- Broker intro: split 60/40 azul/foto, nome em Gotham Bold, bio em Gotham Regular
- Property summary: fundo branco, métricas em azul, destaques com acento vermelho
- Market study: fundo neutro claro, stats com vermelho nos valores, gráfico refinado
- Pricing scenarios: 3 colunas com separadores vermelhos finos
- Closing: fundo azul, nome em vermelho, contato em branco

### `src/components/layouts/LayoutPremium.tsx`
- Rewrite completo: versão mais luxuosa com gradientes azul mais profundos
- Elementos decorativos: linhas vermelhas finas, radial gradients sutis
- Cover com composição cinematográfica e tipografia Gotham Black oversize
- Closing com aspas decorativas e composição centrada premium

### `src/components/layouts/LayoutImpactoComercial.tsx`
- Rewrite completo: versão bold/comercial
- Cover com título uppercase Gotham Black, barra vermelha larga
- Conteúdo com blocos de cor sólida vermelha para métricas de destaque
- Contraste mais agressivo, uppercase frequente, peso visual alto

### Sem alterações em:
- `SectionRenderer.tsx` (interface mantida)
- Lógica de negócio, rotas, Edge Functions, banco de dados
- `MarketCharts.tsx` (apenas receberá novas cores via props)

