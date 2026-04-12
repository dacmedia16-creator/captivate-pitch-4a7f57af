

# Adicionar Links dos Comparáveis na Tabela de Resultados

## Problema
A tabela de comparáveis em `MarketStudyResult.tsx` não exibe o `source_url` de cada imóvel. O campo já existe no banco de dados (`market_study_comparables.source_url`), mas não é renderizado na UI.

## Solução

**Arquivo:** `src/pages/agent/MarketStudyResult.tsx`

Na tabela de comparáveis (linha ~516-578):
- Adicionar coluna "Fonte" no header
- Na célula do imóvel (ou em coluna separada), exibir `source_url` como link clicável que abre em nova aba
- Se `source_url` existir, mostrar `source_name` como texto do link; senão, mostrar apenas o nome da fonte como texto
- Importar `ExternalLink` do lucide-react para o ícone

A mudança é em um único arquivo, apenas adicionando uma coluna `<th>` e `<td>` correspondente na tabela existente.

