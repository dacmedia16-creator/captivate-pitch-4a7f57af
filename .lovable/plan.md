

# Adicionar Campos Completos do Imóvel ao Wizard da Apresentação

## Problema

O `StepPropertyData` (wizard) tem campos básicos, mas falta vários campos que o `SubjectPropertyForm` (estudo de mercado antigo) tinha e que são essenciais para o motor de similaridade e ajustes:

| Campo | SubjectPropertyForm | StepPropertyData |
|-------|:---:|:---:|
| conservation_state | Yes | No |
| construction_standard | Yes | No |
| differentials (checkboxes) | Yes | No (só texto livre) |
| condominium_fee | Yes | No |
| iptu | Yes | No |
| pricing_objective | Yes | No |
| living_rooms | Yes | No |
| powder_rooms | Yes | No |
| state | Yes | No |
| area_useful | Yes | No |

## Solução

### 1. Expandir `PropertyData` e `StepPropertyData`

**Arquivo:** `src/components/wizard/StepPropertyData.tsx`

Adicionar ao `PropertyData`:
- `state: string`
- `area_useful: string`
- `living_rooms: string`
- `powder_rooms: string`
- `construction_standard: string`
- `conservation_state: string`
- `differentials: string[]` (array de checkboxes — Piscina, Área Gourmet, etc.)
- `condominium_fee: string`
- `iptu: string`
- `pricing_objective: string`

Adicionar à UI:
- No card "Localização": campo Estado
- No card "Características": campos Área útil, Salas, Lavabos, Padrão construtivo (substituir o select "Padrão" atual), Estado de conservação
- Novo card "Diferenciais" com checkboxes (mesma lista do SubjectPropertyForm: Piscina, Área Gourmet, Escritório, etc.)
- No card "Detalhes": campos Valor do condomínio, IPTU anual, Objetivo de precificação (select)

### 2. Atualizar `emptyProperty` no `AgentNewPresentation`

**Arquivo:** `src/pages/agent/AgentNewPresentation.tsx`

Adicionar os novos campos ao `emptyProperty` com valores padrão vazios.

### 3. Passar campos completos ao `subjectForScoring` e ao `market_study_subject_properties`

**Arquivo:** `src/pages/agent/AgentNewPresentation.tsx`

Atualizar o `subjectForScoring` e o insert de `market_study_subject_properties` para incluir:
- `conservation_state`
- `construction_standard`
- `differentials`
- `condominium_fee`
- `iptu`
- `pricing_objective`
- `living_rooms`
- `powder_rooms`
- `state`
- `area_useful`

### 4. Salvar novos campos na tabela `presentations` (se existirem as colunas)

As colunas `condominium_fee`, `iptu`, `construction_standard`, `conservation_state`, `differentials`, `pricing_objective`, `state`, `living_rooms`, `powder_rooms` NÃO existem na tabela `presentations`. Esses campos serão salvos apenas no `market_study_subject_properties` (que já tem todas essas colunas).

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/wizard/StepPropertyData.tsx` | Modificar — expandir PropertyData + adicionar campos à UI |
| `src/pages/agent/AgentNewPresentation.tsx` | Modificar — emptyProperty + subjectForScoring + subject_properties insert |

Nenhuma migração necessária — `market_study_subject_properties` já tem todas as colunas.

