

# Exibir Todos os Dados do Perfil no Slide do Corretor

## Problema

O corretor cadastra **educação** e **regiões de atuação** no perfil, e esses dados já são salvos no `content` da seção `broker_intro` pelo `useGeneratePresentation.ts`. Porém os 3 layouts ignoram esses campos — só mostram nome, CRECI, bio, anos, especialidades e VGV.

## O que será adicionado nos slides

Campos que faltam nos layouts:
- **`education`** (Formação) — ex: "MBA em Gestão Imobiliária - FGV"
- **`service_regions`** (Regiões de atuação) — ex: "Jardins, Itaim Bibi, Vila Nova Conceição"

## Arquivos a editar

### 1. `src/components/layouts/LayoutExecutivo.tsx` (broker_intro, linhas 47-80)
- Adicionar `education` abaixo da bio (texto discreto)
- Adicionar `service_regions` ao bloco de métricas junto com anos e especialidades

### 2. `src/components/layouts/LayoutPremium.tsx` (broker_intro, linhas 54-73)
- Adicionar `education` e `service_regions` abaixo da bio
- Adicionar bloco de métricas (anos + especialidades) que está ausente neste layout

### 3. `src/components/layouts/LayoutImpactoComercial.tsx` (broker_intro, linhas 41-71)
- Adicionar `education` abaixo da bio
- Adicionar `service_regions` como badge/bloco adicional

## Sem alterações em
- `useGeneratePresentation.ts` — já passa `education` e `service_regions` no content
- Banco de dados, rotas, perfil do corretor

