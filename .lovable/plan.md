

# Completar o Fluxo do Estudo de Mercado na Apresentação

## Problema

O `handleGenerate` em `AgentNewPresentation.tsx` cria o estudo de mercado com comparáveis, ajustes e resultado, mas falta:

1. **Chamada ao `generate-market-summary`** — a edge function que gera resumo executivo, justificativa e insights por IA nunca é invocada. O campo `executive_summary` fica com texto genérico e `justification` + `market_insights` ficam vazios.
2. **Estudo só é criado com comparáveis** — se nenhum portal for selecionado ou o scraping falhar, nenhum `market_study` é criado. Deveria ao menos criar o estudo com status "draft" ou "sem dados".

## Solução

### 1. Chamar `generate-market-summary` após salvar o resultado

**Arquivo:** `src/pages/agent/AgentNewPresentation.tsx`

Após o `supabase.from("market_study_results").insert(...)` (linha ~351), adicionar:

```typescript
// Gerar resumo por IA
try {
  const { data: aiSummary } = await supabase.functions.invoke("generate-market-summary", {
    body: {
      subject: subjectForScoring,
      comparables: studyComparables,
      result: { ...result, avg_price_per_sqm: Math.round(avgPriceSqm) },
    },
  });

  if (aiSummary?.executive_summary) {
    await supabase.from("market_study_results")
      .update({
        executive_summary: aiSummary.executive_summary,
        justification: aiSummary.justification,
        market_insights: aiSummary.market_insights,
      })
      .eq("market_study_id", study.id);
  }
} catch (aiErr) {
  console.warn("AI summary generation failed (non-fatal):", aiErr);
}
```

### 2. Criar estudo mesmo sem comparáveis

Mover a criação do `market_study` para fora do bloco `if (generatedComparables.length > 0)`, logo após o scraping. Se não houver comparáveis, o estudo fica com status `"completed"` mas sem dados — o `MarketStudyResult` já lida com listas vazias.

### 3. Passar `owner_expected_price` no subject para o AI

O `subjectForScoring` atual não inclui `owner_expected_price`, que é essencial para o prompt do `generate-market-summary`. Adicionar esse campo.

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/agent/AgentNewPresentation.tsx` | Modificar — adicionar chamada `generate-market-summary`, mover criação do estudo para fora do if de comparáveis, incluir `owner_expected_price` no subject |

Nenhuma migração necessária.

