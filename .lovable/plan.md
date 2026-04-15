

# Fix: Indicador de progresso do estudo de mercado não funciona

## Problema

A mensagem retornada pelo edge function `analyze-market-deep` é `"Processing started via Inngest"`, mas o frontend em `AgentNewPresentation.tsx` compara com `"Processing started in background"`. Como as strings não coincidem, o polling nunca inicia e o stepper de fases nunca aparece.

**Linha 217 do frontend:**
```ts
if (!deepError && deepResult?.message === "Processing started in background") {
```

**Linha 180 do edge function:**
```ts
JSON.stringify({ success: true, message: "Processing started via Inngest", ... })
```

## Solução

Mudar a verificação no frontend para checar o `success: true` + ausência de `comparables` (resposta 202), em vez de depender de uma string exata de mensagem. Isso é mais robusto.

## Mudança

### `src/pages/agent/AgentNewPresentation.tsx` (linha 217)

Trocar:
```ts
if (!deepError && deepResult?.message === "Processing started in background") {
```
Por:
```ts
if (!deepError && deepResult?.success && !deepResult?.comparables?.length && deepResult?.market_study_id) {
```

Isso cobre tanto a resposta Inngest (`"Processing started via Inngest"`) quanto qualquer outra variante futura de processamento assíncrono.

## Escopo
- 1 arquivo, 1 linha editada
- Sem migrations, sem mudanças no backend

