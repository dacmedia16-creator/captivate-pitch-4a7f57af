

# Auto-selecionar todos os portais ativos no wizard

## Problema
Quando ocultamos o card de seleção de portais, o `selectedPortals` ficou como `[]`. O `runMarketAnalysisBackground` verifica `if (mktData.selectedPortals.length === 0) return;` e pula o estudo de mercado inteiro.

## Solução

### `src/components/wizard/StepMarketStudy.tsx`
Adicionar um `useEffect` que auto-seleciona todos os portais habilitados assim que a query carrega, **somente se `selectedPortals` estiver vazio**:

```typescript
import { useEffect } from "react";

// Dentro do componente, após a query:
useEffect(() => {
  if (portalList && portalList.length > 0 && data.selectedPortals.length === 0) {
    const enabledIds = portalList
      .filter((p: any) => p.is_enabled)
      .map((p: any) => p.id);
    if (enabledIds.length > 0) {
      onChange({ ...data, selectedPortals: enabledIds });
    }
  }
}, [portalList]);
```

Isso garante que todos os portais habilitados (incluindo VIP Seven) sejam automaticamente selecionados quando o step de mercado é renderizado.

## Escopo
- 1 arquivo editado (`StepMarketStudy.tsx`)
- ~8 linhas adicionadas
- Nenhuma mudança no backend

