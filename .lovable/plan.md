

# Adicionar Filtro de Similaridade Mínima e Scoring de Diferenciais

## Problema
A edge function `analyze-market-deep` aceita qualquer imóvel que tenha preço e área válidos. Não há score mínimo de similaridade, então um apartamento de 2 quartos / 94m² sem piscina pode entrar como comparável de um de 3 quartos com piscina e academia.

## Alterações

### `supabase/functions/analyze-market-deep/index.ts`

**1. Adicionar filtro de similaridade mínima (após linha 619):**
```typescript
const minSimilarity = 40; // Score mínimo para ser considerado comparável
if (similarity < minSimilarity) {
  discardReasons.push({
    url: c.source_url || "unknown",
    portal: c.source_name || "unknown",
    reason: `Similaridade muito baixa (${similarity}/100)`,
  });
  continue;
}
```

**2. Adicionar scoring de diferenciais no cálculo de similaridade (após rooms score, ~linha 609):**

Comparar os diferenciais do imóvel de referência com os do comparável extraído pela IA. Se compartilham diferenciais como piscina, academia, churrasqueira, adicionar pontos extras.

```typescript
// Differentials overlap
if (property.differentials?.length && c.differentials?.length) {
  const subjectDiffs = property.differentials.map(d => d.toLowerCase());
  const compDiffs = c.differentials.map(d => d.toLowerCase());
  const overlap = subjectDiffs.filter(d => compDiffs.some(cd => cd.includes(d) || d.includes(cd)));
  const ratio = overlap.length / subjectDiffs.length;
  if (ratio >= 0.5) score += 5;
  else if (ratio >= 0.25) score += 3;
}
```

**3. Melhorar o prompt da IA (linha 462)** para enfatizar a extração de diferenciais de cada anúncio (piscina, academia, churrasqueira, etc.)

## Resultado Esperado
- Imóveis com score < 40 são descartados com motivo claro nos logs
- Diferenciais passam a influenciar o ranking de similaridade
- O apartamento de 2 quartos sem piscina/academia seria descartado por baixa similaridade

