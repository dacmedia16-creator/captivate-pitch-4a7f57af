

# Plano: Corrigir scoring de similaridade (19 → 3 válidos)

## Problemas encontrados

### Bug 1 — Direção do `includes` no bairro está invertida
**Linha 1082**: `c.neighborhood.toLowerCase().includes(property.neighborhood.toLowerCase())`  
Se IA retorna "Campolim" e o subject é "Parque Campolim", `"campolim".includes("parque campolim")` = FALSE.  
Deveria ser bidirecional: qualquer um contendo o outro.

### Bug 2 — Campo `property_standard` não existe no subject
**Linha 1101**: `property.property_standard` — o subject vem de `market_study_subject_properties` que tem o campo `construction_standard`, não `property_standard`. Resultado: matching de padrão construtivo NUNCA funciona (perde 10 pontos).

### Bug 3 — Bônus de cidade exige score >= 30 primeiro
**Linha 1116**: `score >= 30` para dar +5 de cidade. Mas se bairro e padrão já falharam (bugs 1 e 2), o score pode estar abaixo de 30 mesmo para imóveis na mesma cidade.

### Bug 4 — Sem log de scores individuais
Impossível debugar sem ver o score de cada comparável descartado.

### Impacto estimado
Com os bugs corrigidos, um imóvel típico do mesmo condomínio + bairro + cidade ganharia:
- Condomínio: +25
- Bairro (corrigido): +20
- Tipo: +15
- Padrão (corrigido): +10
- Cidade (bônus): +5
- **Total base: 75** (vs ~25-35 com bugs)

## Correções (todas em `analyze-market-deep/index.ts`)

### 1. Tornar matching de bairro bidirecional
```typescript
// De:
if (c.neighborhood.toLowerCase().includes(property.neighborhood.toLowerCase()))
// Para:
const compNeigh = c.neighborhood.toLowerCase();
const subjNeigh = property.neighborhood.toLowerCase();
if (compNeigh.includes(subjNeigh) || subjNeigh.includes(compNeigh))
```

### 2. Corrigir campo de padrão construtivo
```typescript
// De:
property.property_standard
// Para:
property.construction_standard || property.property_standard
```

### 3. Remover pré-requisito de score >= 30 no bônus de cidade
```typescript
// De:
if (c.city... && score >= 30) score += 5;
// Para:
if (c.city...) score += 5;
```

### 4. Adicionar log de scores individuais (top 5 descartados)
Logar os 5 comparáveis com maior score que foram descartados, mostrando: URL, score, razão.

### 5. Aplicar mesma lógica bidirecional ao condomínio
Para pegar "Residencial Cannes" vs "Cannes".

## Etapas
1. Corrigir matching bidirecional (bairro + condomínio)
2. Corrigir campo `construction_standard`
3. Remover requisito `score >= 30` do bônus cidade
4. Adicionar logs de score dos descartados
5. Deploy + teste

## Arquivo modificado
`supabase/functions/analyze-market-deep/index.ts` — ~15 linhas alteradas

