

# QuintoAndar não aparece no wizard de estudo de mercado

## Diagnóstico

O QuintoAndar foi inserido corretamente na tabela `portal_sources` (confirmado via query). Porém, o componente `SearchConfigForm` só mostra portais que já têm um registro em `tenant_portal_settings` com `is_enabled = true` para o tenant do usuário.

Como o QuintoAndar é novo, nenhum tenant tem um registro habilitado para ele — então não aparece na lista do wizard.

## Solução

Duas opções — recomendo ambas:

### 1. Caminho rápido: habilitar QuintoAndar para o tenant atual
Criar um registro em `tenant_portal_settings` para o tenant do usuário (via migration).

### 2. Correção estrutural no SearchConfigForm
Alterar o `SearchConfigForm` para mostrar **todos os portais globais** (`is_global = true`) da tabela `portal_sources`, mesmo que o tenant não tenha um registro em `tenant_portal_settings`. Portais globais aparecem pré-selecionados por padrão. Isso resolve o problema para todos os tenants automaticamente.

## Mudanças

### `src/components/market-study/SearchConfigForm.tsx`
Mudar a query para buscar `portal_sources` com `is_global = true` e fazer LEFT JOIN com `tenant_portal_settings`. Portais globais sem registro no tenant aparecem habilitados por padrão. Portais com `is_global = false` só aparecem se tiverem registro habilitado.

### Sem migration necessária
A correção no frontend resolve para todos os tenants e portais futuros.

## Escopo
- 1 arquivo editado: `SearchConfigForm.tsx` (~15 linhas na query)
- QuintoAndar (e qualquer portal global futuro) aparecerá automaticamente

