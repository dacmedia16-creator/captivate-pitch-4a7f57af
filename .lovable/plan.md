## Objetivo

Religar o fluxo automático de pesquisa de mercado usando a **GeckoAPI** (`https://api.geckoapi.com.br/v1/extract`). O corretor preenche o imóvel avaliado e o sistema faz **PLP → PDP em cascata** no Zap Imóveis: busca a listagem, pega os top N anúncios e extrai cada um, gravando tudo direto em `market_study_comparables` + cálculo final em `market_study_results`.

Esse mesmo fluxo é exposto em **dois lugares**:
1. Reativando o `creation_mode: "automatico"` em `AgentNewPresentation.tsx`.
2. Como um novo botão **"Buscar automaticamente (Gecko)"** na Etapa 1 do wizard manual `/market-studies/new`, que pré-popula a lista de comparáveis (corretor ainda pode revisar/excluir antes de avançar).

## Credencial

Secret global `GECKOAPI_TOKEN` (runtime secret no Lovable Cloud). Único token compartilhado por todos os tenants.

## Backend — nova Edge Function `gecko-market-search`

Arquivo: `supabase/functions/gecko-market-search/index.ts` (com `_shared/cors.ts` se ainda não existir).

**Entrada (JSON):**
```ts
{
  market_study_id: string,        // study já criado pelo frontend
  subject: {
    city: string,
    state: string,                // UF
    bedrooms?: number,
    business_type: "sale"|"rent", // "sale" por padrão
    min_price?: number, max_price?: number,
    min_area?: number, max_area?: number,
    keyword?: string,             // opcional, ex. "apartamento 2 quartos"
  },
  max_comparables?: number,       // default 10
}
```

**Pipeline:**
1. Valida JWT (`getClaims`), valida `GECKOAPI_TOKEN`.
2. Marca `market_studies.status = 'processing'`, `current_phase = 'Buscando anúncios no Zap'`.
3. **POST PLP** Gecko → `target: "zapimoveis.com.br"`, `type: "plp"`, `page: 1`, monta query a partir do subject.
4. Itera nos N primeiros resultados (default 10, cap 20):
   - `current_phase = "Extraindo anúncio X/N"`
   - **POST PDP** Gecko → `target: "zapimoveis.com.br"`, `type: "pdp"`, `url: <url>`.
   - Normaliza payload em uma linha de `market_study_comparables` (campos: `source_url`, `source_name='Zap Imóveis'`, `origin='auto_gecko'`, `title`, `price`, `area`, `bedrooms`, `bathrooms`, `parking_spaces`, `neighborhood`, `city`, `state`, `condominium_fee`, `iptu`, `latitude`, `longitude`, `raw_data` JSON com payload original).
   - Insere via service_role no `market_study_comparables`.
   - Erros por anúncio são logados em `market_study_executions` mas não abortam a cascata.
5. Após cascata: chama o cálculo (mesma lógica de `useManualMarketAnalysis`, portada para Deno em `_shared/market-calc.ts`) e grava `market_study_results` + `market_studies.status='completed'`.
6. Em qualquer erro fatal: `status='failed'`, `current_phase='Erro: ...'`.

Resposta imediata: `202 { study_id, scheduled: true }` — o front faz polling do `market_studies.status` (igual ao padrão atual descrito em `market-study-architecture.md`).

**Erros da Gecko:**
- 401/403 → "Token GeckoAPI inválido. Avise o admin."
- 402 → "Sem créditos na GeckoAPI."
- 429 → backoff 2s e 1 retry, depois falha.
- 5xx → 1 retry com backoff.

## Frontend

### A) Wizard manual — `src/pages/agent/NewMarketStudy.tsx` (Etapa 1)

Acima do bloco "Cole o link", adicionar um card **"Buscar automaticamente"** com:
- Bullet curto: "Usamos a GeckoAPI para buscar e extrair anúncios do Zap Imóveis com base no imóvel avaliado."
- Botão `Buscar automaticamente no Zap Imóveis` (ícone `Sparkles`).
- Ao clicar:
  - Garante que Etapa 0 tem `city`, `state` e `bedrooms` (senão `toast.error`).
  - Chama `supabase.functions.invoke("gecko-market-search", { body: {...} })`.
  - Modal com progresso lendo `market_studies.current_phase` por polling a cada 3s.
  - Quando `status='completed'`: refetch dos comparáveis e fecha modal; corretor segue revisando normalmente.

Nenhuma quebra do fluxo manual existente — colar URL e "Sugerir com IA" continuam funcionando.

### B) Nova apresentação — `src/pages/agent/AgentNewPresentation.tsx`

O modo `creation_mode: "automatico"` hoje cria um `market_study` e chama `analyze-market` (410). Trocar para:
1. Criar `market_studies` + `market_study_subject_properties` como hoje.
2. Chamar **`gecko-market-search`** com o subject (default 10 comparáveis, `business_type` herdado do imóvel).
3. Polling de `market_studies.status` (5s, mesma lógica de hoje).
4. Quando `completed`: ler `market_study_results` e popular as `presentation_sections` (já existe `syncMarketStudySections`).

Remover qualquer referência a `analyze-market`, `analyze-market-deep`, `analyze-market-manus` no caminho desse modo automático.

## Banco

Nenhuma nova tabela. Apenas:
- Adicionar `'auto_gecko'` como valor aceito em `market_study_comparables.origin` (se houver CHECK constraint; senão é string livre).

## Secret

Solicitar `GECKOAPI_TOKEN` via `add_secret` antes de qualquer deploy.

## Detalhes técnicos (para devs)

- **Edge function** `gecko-market-search`:
  - `verify_jwt = true` (padrão), valida user, pega `tenant_id` via `profiles`.
  - Usa `SUPABASE_SERVICE_ROLE_KEY` para inserts.
  - `EdgeRuntime.waitUntil(...)` para rodar a cascata em background e responder 202 rápido.
- **Mapeamento payload Gecko PDP → comparable:** confirmar shape exato no primeiro request real; encapsular em `mapGeckoPdpToComparable(payload)` para isolar.
- **Cálculo:** portar `calculateManualAnalysis` (de `src/hooks/useManualMarketAnalysis.ts`) para `supabase/functions/_shared/market-calc.ts` para reuso server-side.
- **Botão "Buscar automaticamente"** desabilitado se city/state vazios; mostra tooltip explicando.
- **Limites:** cap em 20 comparáveis por busca para evitar gasto de créditos descontrolado.
- **Custo visível:** mostrar no modal "Estimado: N+1 créditos GeckoAPI".

## Arquivos afetados

- **Novo**: `supabase/functions/gecko-market-search/index.ts`
- **Novo**: `supabase/functions/_shared/market-calc.ts` (port do `useManualMarketAnalysis`)
- **Editado**: `src/pages/agent/NewMarketStudy.tsx` (botão + modal de progresso)
- **Editado**: `src/pages/agent/AgentNewPresentation.tsx` (trocar `analyze-market` por `gecko-market-search`)
- **Novo secret**: `GECKOAPI_TOKEN`

## Como testar

1. Adicionar o secret `GECKOAPI_TOKEN`.
2. Em `/market-studies/new`: preencher imóvel em Curitiba/PR, 2 quartos; clicar **Buscar automaticamente** → modal mostra "Buscando…", depois "Extraindo 1/10"… → ao terminar, lista da Etapa 1 vem preenchida com 10 anúncios do Zap.
3. Avançar até a Etapa 4 e ver `market_study_results` com média/mediana/faixas.
4. Em `/nova apresentação` modo Automático: criar; tela "Processando" agora avança normalmente até "Concluído" em vez de travar.
5. Forçar token inválido → erro amigável no toast.
