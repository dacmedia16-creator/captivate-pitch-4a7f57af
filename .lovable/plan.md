
Objetivo

- Corrigir o erro restante do Inngest no passo “Invoke your function”.

O que encontrei

- `supabase/functions/inngest-serve/index.ts` já usa `triggers`, então o problema da captura não é mais o `trigger` vs `triggers`.
- O arquivo ainda importa `serve` de `inngest@4.2.2/edge`; para este runtime, a integração esperada é com `inngest/deno`.
- Para trigger único, a documentação v4 usa o formato `triggers: { event: "..." }`; hoje o código usa array com 1 item. Pode funcionar, mas vou alinhar exatamente ao formato documentado para eliminar ambiguidade.
- O aviso de “desempenho degradado” no painel pode atrasar a execução, mas não explica sozinho o erro de leitura de `triggers`.

Plano

1. Ajustar `supabase/functions/inngest-serve/index.ts`
   - trocar o import do adapter para `https://esm.sh/inngest@4.2.2/deno`
   - manter o SDK fixado em `4.2.2`
   - alterar o `createFunction` para o formato v4 canônico:
     `triggers: { event: "market-study/analyze.requested" }`

2. Validar a função após o ajuste
   - fazer deploy apenas de `inngest-serve`
   - testar o endpoint para confirmar que a app continua expondo 1 função e que o manifest inclui o trigger corretamente
   - checar logs recentes do `inngest-serve` para garantir que ele sobe sem erro

3. Validar no Inngest
   - refazer o sync da app
   - repetir o passo “Invoke your function”
   - se ainda falhar, comparar manifest + logs para identificar se restou algum problema de adapter/serialização, não de evento

Escopo

- Sem mudanças de banco
- Sem mudanças no frontend
- `analyze-market-deep` permanece como está, porque o disparo do evento já existe

Arquivo previsto

- `supabase/functions/inngest-serve/index.ts`

Resultado esperado

- O painel do Inngest deixa de quebrar no passo de invoke
- A função `market-study-analyze` continua descoberta e passa a ficar invocável tanto pelo dashboard quanto pelo fluxo normal do estudo de mercado
