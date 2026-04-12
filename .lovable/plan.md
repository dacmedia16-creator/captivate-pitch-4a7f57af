

# Garantir Links dos Imóveis nos Comparáveis

## Diagnóstico

A coluna "Fonte" com links já existe no código de `MarketStudyResult.tsx` (linhas 524, 564-578). O problema é que os **comparáveis simulados** (gerados pelo `useSimulateComparables.ts`) sempre definem `source_url: ""`, o que faz a coluna mostrar "—" em vez de um link.

Para comparáveis reais (via Firecrawl/IA), o `source_url` já é extraído e salvo corretamente pela edge function `analyze-market`.

## Solução

### 1. Gerar URLs realistas nos comparáveis simulados

**Arquivo:** `src/hooks/useSimulateComparables.ts`

- Gerar `source_url` com base no portal selecionado usando URLs plausíveis (ex: `https://www.zapimoveis.com.br/imovel/...`, `https://www.vivareal.com.br/imovel/...`)
- Usar o nome do portal para determinar o domínio base e gerar um ID aleatório

### 2. Confirmar que a coluna Fonte está visível

**Arquivo:** `src/pages/agent/MarketStudyResult.tsx`

- Já implementado — apenas confirmar que está funcionando após o fix dos dados simulados

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/hooks/useSimulateComparables.ts` | Modificar — gerar `source_url` realista por portal |

