## Objetivo

Permitir editar o **link** de cada comparável já adicionado no wizard (hoje só dá para revisar dados internos e excluir), endurecer a remoção com confirmação e centralizar a validação de URL para que ela rode tanto ao adicionar quanto ao editar — bloqueando o avanço de etapa se houver link inválido.

## O que muda na UI (Etapa 1 — "Links" do `NewMarketStudy.tsx`)

Cada linha da lista de comparáveis hoje mostra: badge do portal, link clicável, status "Completo/Faltam dados", botões **Revisar** e **Excluir**. Vamos adicionar:

- Botão **Editar link** (ícone `Link`) ao lado de "Revisar".
  - Clicar abre um pequeno modal `EditComparableUrlDialog` com um único `Input` (URL) + Cancelar / Salvar.
  - Ao salvar: valida a URL, redetecta o portal (`detectPortalFromUrl`), checa duplicidade contra os outros comparáveis e faz `UPDATE market_study_comparables SET source_url, source_name WHERE id = ...`.
  - Atualiza o estado local sem refazer a etapa.
- Botão **Excluir** passa a abrir o `ConfirmDialog` já existente (`src/components/shared/ConfirmDialog.tsx`) com texto "Remover este comparável? Esta ação não pode ser desfeita." em vez de remover direto.

## Validação de URL centralizada

Criar um helper único `src/lib/validateListingUrl.ts` com:

```ts
export type UrlValidationResult = { valid: true; url: string } | { valid: false; reason: string };
export function validateListingUrl(input: string): UrlValidationResult;
```

Regras:
- `trim()`; rejeitar vazio.
- Se não começar com `http://` ou `https://`, prefixar `https://` automaticamente.
- `new URL(...)` deve passar; protocolo precisa ser `http`/`https`; precisa ter hostname com pelo menos um ponto (evita "abc").
- Retorna a URL normalizada (sem espaços, com protocolo).

Esse helper passa a ser usado em três pontos:
1. `handleAddLink` (input "Cole o link do anúncio").
2. Novo `EditComparableUrlDialog` (edição do link).
3. Função `canAdvance()` da Etapa 1: só libera o botão "Próximo" se **todos** os `comparables[i].source_url` passarem na validação e existir pelo menos 1 comparável (regra atual de quantidade preservada).

Mensagens de erro vão para `toast.error(reason)` no input/modal; no botão "Próximo" desabilitado, mostrar um pequeno texto auxiliar abaixo da lista quando houver link inválido.

## Arquivos afetados

- `src/lib/validateListingUrl.ts` — novo helper + testes simples opcionais.
- `src/components/market-study/EditComparableUrlDialog.tsx` — novo modal pequeno (Input + footer Salvar/Cancelar).
- `src/pages/agent/NewMarketStudy.tsx`:
  - Importar helper, `ConfirmDialog` e o novo dialog.
  - Substituir validação inline em `handleAddLink` pelo helper.
  - Adicionar `handleEditUrl(id, newUrl)` com update no Supabase + atualização do estado.
  - Adicionar estado `editingUrl: ComparableRow | null` e `removingId: string | null`.
  - Trocar botão Excluir para abrir `ConfirmDialog`.
  - Endurecer `canAdvance()` para também checar URLs válidas na Etapa 1.

Nada muda no banco, no `ComparableReviewModal`, nem nas Etapas 0/2/3/4.

## Como testar

1. Em `/market-studies/new`, preencher Etapa 0 e avançar.
2. Etapa 1: colar `abc` → deve dar erro de URL inválida.
3. Colar `vivareal.com.br/imovel/123` (sem protocolo) → deve aceitar e salvar como `https://...`.
4. Adicionar outro link, clicar **Editar link**, alterar a URL → portal detectado novamente, lista atualizada.
5. Tentar editar para um link já existente em outro comparável → erro de duplicidade.
6. Clicar **Excluir** → aparece `ConfirmDialog`; cancelar mantém o item; confirmar remove.
7. Forçar um `source_url` inválido (ex.: editando para `ftp://x`) → botão "Próximo" desabilitado com aviso.