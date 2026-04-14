

# Diagnóstico: Por que o Kenlo nunca aparece nos resultados

## Evidências dos logs

1. **FASE 1A** (scrape nativo): Kenlo URL construída corretamente (`portal.kenlo.com.br/imoveis/a-venda/apartamento/sorocaba/parque-campolim?quartos=3+`), mas retornou apenas 13 links genéricos e **0 links de anúncio individual**. O markdown extraído tem apenas 914 chars — Kenlo é um SPA (React/Angular) que carrega conteúdo via JavaScript, e o Firecrawl não consegue renderizar o conteúdo dinâmico mesmo com `waitFor: 5000`.

2. **FASE 1B** (Google): Encontrou 8 URLs do Kenlo via Google, incluindo URLs individuais válidas como `/imovel/apartamento-sorocaba-3-quartos-97-m/AP2160-F1`.

3. **FASE 2** (scrape individual): As URLs Kenlo foram abertas, mas o conteúdo provavelmente é mínimo (SPA sem server-side rendering).

4. **FASE 3** (extração AI): A IA processa todas as páginas juntas e atribui `source_name` livremente. Os resultados finais mostram **100% Viva Real, 0% Kenlo** — a IA ignora as páginas Kenlo porque o markdown delas é vazio ou irrelevante.

## Causa raiz

**Kenlo é um SPA que não faz Server-Side Rendering.** O Firecrawl retorna páginas quase vazias. A IA então não consegue extrair dados das páginas Kenlo, resultando em 0 comparáveis atribuídos a esse portal.

## Solução proposta

### 1. Forçar renderização JavaScript no Firecrawl para Kenlo
Na FASE 2, quando o portal é Kenlo, usar as opções `actions` do Firecrawl para esperar a renderização do conteúdo:
```typescript
if (portal.code === "kenlo") {
  body.actions = [
    { type: "wait", milliseconds: 8000 },
    { type: "scroll", direction: "down", amount: 3 }
  ];
  body.waitFor = 10000;
}
```

### 2. Fallback: scraping via Google Cache
Se o Firecrawl retornar markdown < 500 chars para Kenlo, tentar buscar a versão cacheada do Google (`webcache.googleusercontent.com/search?q=cache:URL`).

### 3. Atribuição forçada de portal na FASE 3
Após a extração AI, cruzar o `source_url` de cada comparável com a URL original da página scrapeada para atribuir o `source_name` correto:
```typescript
// Se a URL contém "kenlo.com.br", forçar source_name = "Kenlo"
if (/kenlo\.com\.br/i.test(c.source_url)) c.source_name = "Kenlo";
```
Isso corrige o caso onde a IA atribui erroneamente ao Viva Real.

### 4. Log de diagnóstico: tamanho do markdown por portal
Adicionar log do tamanho do markdown retornado por portal na FASE 2 para monitorar quais portais estão retornando conteúdo vazio.

## Arquivo modificado
`supabase/functions/analyze-market-deep/index.ts`

## Prioridade
1. Atribuição forçada de portal (fix imediato, 5 linhas)
2. `waitFor` maior + actions para Kenlo (fix de renderização)
3. Log de diagnóstico
4. Fallback via Google Cache (opcional, mais complexo)

