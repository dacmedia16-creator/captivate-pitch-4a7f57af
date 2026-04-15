

# Indicador de progresso por fase no estudo de mercado

## Abordagem

Usar uma coluna `current_phase` na tabela `market_studies` que o edge function atualiza a cada step do Inngest. O frontend já faz polling no status — basta ler essa coluna extra e renderizar um stepper visual.

## Fases

| Phase value | Label no frontend |
|---|---|
| `collecting_urls` | Coletando URLs dos portais |
| `scraping` | Abrindo páginas dos anúncios |
| `extracting` | Extraindo dados com IA |
| `scoring` | Analisando e salvando resultados |
| `completed` | Concluído |

## Mudanças

### 1. Migration: adicionar coluna `current_phase`
```sql
ALTER TABLE market_studies ADD COLUMN current_phase text DEFAULT NULL;
```

### 2. `supabase/functions/inngest-serve/index.ts`
Adicionar updates de `current_phase` no início de cada step:
- `set-processing` → `current_phase: 'collecting_urls'`
- `scrape-batch-0` (só no primeiro batch) → `current_phase: 'scraping'`
- `ai-extraction` → `current_phase: 'extracting'`
- `score-and-save` → `current_phase: 'scoring'`
- No final (status=completed) → `current_phase: 'completed'`

### 3. `src/pages/agent/AgentNewPresentation.tsx` — polling
No `pollStudyStatus`, selecionar também `current_phase` e passar para o `StepGeneration`.

### 4. `src/components/wizard/StepGeneration.tsx` — UI do stepper
Adicionar uma seção "Estudo de Mercado" abaixo do stepper existente (que é para a apresentação). Quando `marketPhase` está definido, mostrar um stepper com as 4 fases do mercado com ícones de status (spinner na fase atual, check nas concluídas, cinza nas pendentes).

### 5. `src/pages/agent/MarketStudyResult.tsx` — indicador na página de resultado
Quando `study.status === 'processing'`, mostrar o mesmo stepper de fases em vez do conteúdo, usando `study.current_phase` para indicar progresso. Adicionar `refetchInterval` de 5s quando status é `processing`.

## Escopo
- 1 migration (1 coluna)
- 3 arquivos editados (inngest handler, StepGeneration, MarketStudyResult)
- 1 arquivo editado levemente (AgentNewPresentation — polling)

