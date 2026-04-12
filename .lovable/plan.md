

# Implementar Estudo de Mercado Real com Firecrawl + IA

Firecrawl conectado. Agora implementar as 3 etapas restantes.

## 1. Criar edge function `analyze-market`

**Arquivo**: `supabase/functions/analyze-market/index.ts`

- Recebe: dados do imovel, portais selecionados, filtros
- Para cada portal selecionado, monta query contextual:
  - Ex: `"apartamento 3 quartos 120m2 Moema Sao Paulo venda site:zapimoveis.com.br"`
- Usa Firecrawl Search API (`https://api.firecrawl.dev/v1/search`) com `scrapeOptions: { formats: ['markdown'] }`
- Envia resultados markdown para Lovable AI (gemini-2.5-flash) com tool calling para extrair dados estruturados:
  - titulo, preco, area, quartos, suites, vagas, endereco, bairro, URL real, nome do portal
- Calcula similarity score comparando com o imovel base
- Retorna array de comparaveis reais

**Mapeamento portais para busca**:
- ZAP Imoveis → `site:zapimoveis.com.br`
- Viva Real → `site:vivareal.com.br`
- OLX → `site:olx.com.br/imoveis`
- Imovelweb → `site:imovelweb.com.br`

## 2. Atualizar wizard (`AgentNewPresentation.tsx`)

- Substituir chamada a `generateSimulatedComparables` por `supabase.functions.invoke('analyze-market', ...)`
- Manter `generateSimulatedComparables` como fallback se a edge function falhar ou retornar poucos resultados
- Adicionar estado de loading com mensagem "Analisando portais..."

## 3. Verificar `portal_sources` no banco

- Consultar tabela para mapear nomes de portais a dominos de busca

## Arquivos
1. **Criar**: `supabase/functions/analyze-market/index.ts`
2. **Modificar**: `src/pages/agent/AgentNewPresentation.tsx`

## Riscos
- Rate limits do Firecrawl (limitar a 3-5 buscas por estudo)
- Qualidade da extração depende do conteudo retornado
- Fallback simulado garante que nunca falha completamente

