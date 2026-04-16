
## Diagnóstico

Os links estão implementados corretamente no código dos layouts, mas a apresentação atual (`4af0a305...`) foi criada **antes** da atualização que passou a salvar `source_url` no conteúdo dos slides. Verifiquei no banco:

- `market_study_comparables` (fonte): tem URLs reais ✅
- `presentation_sections.content` (o que é renderizado): URLs vazias ❌

Ou seja, o layout renderiza corretamente quando há URL — mas como o conteúdo persistido não tem, o `<a>` nunca aparece.

## Solução

**Re-sincronizar as seções de mercado desta apresentação** (e oferecer o mesmo para as demais já existentes), copiando `source_url` de `market_study_comparables` para `presentation_sections.content`.

### Passos

1. **Migration de backfill (SQL)**: Para todas as `presentation_sections` com `section_key = 'market_study_comparables'`, atualizar cada item de `content.comparables` com o `source_url` correspondente do `market_study_comparables` (match por `title` + `market_study_id` da apresentação).

2. **Botão manual de re-sync no editor** (opcional, fallback): adicionar um pequeno botão "Atualizar dados de mercado" no `EditorToolbar` que invoca `syncMarketStudySections(market_study_id)` para a apresentação atual — útil caso o backfill perca algum registro.

### Arquivos afetados

- `supabase/migrations/<nova>.sql` — UPDATE em `presentation_sections` fazendo merge do `source_url` por título.
- `src/components/editor/EditorToolbar.tsx` + `src/pages/agent/PresentationEditor.tsx` — botão "Re-sincronizar mercado" (opcional).

### Resultado esperado

Após o backfill, recarregar a apresentação `4af0a305...` mostrará os títulos da tabela "Comparáveis de Mercado" como links clicáveis (cor accent/dourado) abrindo o anúncio original em nova aba.
