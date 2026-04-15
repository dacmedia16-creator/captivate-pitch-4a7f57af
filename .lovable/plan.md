

# Ocultar seção "Portais de pesquisa" do wizard

## Problema
O usuário quer esconder a seção "Portais de pesquisa" (o card com os toggles dos portais) no step de Market Study do wizard.

## Solução

### `src/components/wizard/StepMarketStudy.tsx`
Remover (ou comentar) o primeiro `<Card>` que contém "Portais de pesquisa" — o bloco com o `portalList.map()` e os switches. Manter os cards de "Filtros de pesquisa" e "Preferências avançadas".

Os portais selecionados continuarão funcionando via o valor default de `selectedPortals` (que já vem preenchido no state do wizard).

## Escopo
- 1 arquivo editado
- Remoção de ~30 linhas (o card de portais)

