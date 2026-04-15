

# Diagnóstico e Plano: Web Scraping no Listing Studio AI

## O que já existe no projeto

O projeto **já possui uma infraestrutura completa de web scraping** implementada e funcional:

| Componente | Implementação atual |
|---|---|
| Edge Function | `analyze-market-deep` (1756 linhas) — scraping via Firecrawl, extração com IA, scoring, persistência |
| Tabelas | `market_studies`, `market_study_comparables`, `market_study_raw_listings`, `market_study_executions`, `market_study_results`, `market_study_adjustments` |
| RLS | Isolamento completo por `broker_id` + `tenant_id` em todas as tabelas |
| Status tracking | `draft → processing → completed → failed` em `market_studies.status` |
| UI | `MarketStudies.tsx` (lista), `MarketStudyResult.tsx` (detalhes), wizard em `AgentNewPresentation.tsx` |
| Secrets | `FIRECRAWL_API_KEY` (connector), `MANUS_API_KEY` — nunca expostos no frontend |
| Background | Edge function responde 202 + polling no frontend a cada 5s |
| Logs | Console logs por fase (1A scrape nativo, 1B Google, FASE 2 extração, FASE 3 scoring) |

### Fluxo atual (ponta a ponta)

```text
Usuário (wizard)
  → Cria market_study + subject_property
  → Chama edge function (Manus → Deep → Basic cascade)
  → Edge function:
      1. Scrape nativo dos portais (Firecrawl)
      2. Fallback Google Search (Firecrawl)
      3. Extração de dados via IA (Gemini)
      4. Scoring de similaridade
      5. Cálculo de ajustes
      6. Persistência em market_study_comparables + results
      7. Atualiza status para "completed"
  → Frontend poll → exibe resultados
```

## Avaliação: O que falta?

A arquitetura já segue as boas práticas do Lovable. O que pode ser melhorado/adicionado:

| Aspecto | Status | Observação |
|---|---|---|
| Secrets no backend | OK | Firecrawl key via connector, Manus via secret |
| Validação no backend | OK | Validação de inputs na edge function |
| Isolamento multi-tenant | OK | RLS em todas as tabelas |
| Rate limit | Parcial | Sem rate limit formal por usuário/plano |
| Retry automático | Parcial | Cascade Manus→Deep→Basic, mas sem retry granular |
| Timeout | OK | Firecrawl tem timeout configurado |
| Logs | OK | Console logs por fase |
| Limites por plano | Ausente | `subscription_plans` existe mas sem enforcement |
| Job queue (Inngest) | Ausente | Usa edge function direta, sem job queue |
| UI de acompanhamento dedicada | Parcial | Existe em `MarketStudies.tsx` mas sem detalhes de execução |

## Recomendação

**Não criar uma nova infraestrutura de scraping.** O sistema atual é robusto. Em vez disso, propor melhorias incrementais:

### Fase 1 — Enforcement de limites por plano (2-3 arquivos)
- Verificar `subscription_plans.max_presentations_per_month` antes de iniciar novo estudo
- Criar tabela `tenant_usage` para tracking de uso mensal
- Bloquear no frontend + validar na edge function

### Fase 2 — Rate limiting e retry (edge function)
- Adicionar rate limit por tenant (max N estudos simultâneos)
- Retry automático com backoff exponencial para falhas de Firecrawl
- Timeout global configurável

### Fase 3 — UI de monitoramento de execuções (novo componente)
- Painel com detalhes de cada execução (`market_study_executions`)
- Logs por portal, URLs processadas, erros
- Filtros por status e data

### Fase 4 — Job queue com Inngest (opcional)
- Migrar execuções longas para Inngest (durable execution)
- Permite agendamento, retry automático, observabilidade
- Requer connector Inngest

## Pergunta ao usuário

Antes de prosseguir com a implementação, preciso entender:

**Você quer melhorar o sistema de scraping existente (market studies) com as fases acima, ou quer criar um sistema de scraping genérico para outros fins além de estudos de mercado imobiliário?**

Se for genérico, descreva o caso de uso — quais sites, que dados, qual a frequência.

---

## Checklist de testes (para o sistema atual)
- [ ] Criar estudo de mercado com todos os portais selecionados
- [ ] Verificar que Kenlo aparece nos resultados (round-robin)
- [ ] Testar falha de Firecrawl (API down) — status deve ir para "failed"
- [ ] Verificar RLS: broker A não vê estudos do broker B
- [ ] Testar polling de status (processing → completed)
- [ ] Recalcular estudo e verificar sync com apresentação

## Riscos técnicos
1. **Firecrawl rate limits** — muitos estudos simultâneos podem exceder cota
2. **SPAs (Kenlo)** — scraping via Firecrawl pode não renderizar JS
3. **Edge function timeout** — estudos com muitos portais podem ultrapassar 60s
4. **Custo** — cada scrape consome créditos Firecrawl

## Critérios de aceite
- Estudo de mercado completa com status "completed" e ≥5 comparáveis
- Dados persistidos com tenant isolation verificado
- Secrets nunca expostos no frontend
- UI mostra status em tempo real

## Pontos de ajuste (custo/performance)
- `MAX_URLS = 25` — reduzir para menos créditos Firecrawl
- `MIN_PER_PORTAL = 3` — ajustar diversidade vs volume
- Cascade Manus→Deep→Basic — desabilitar Manus para economizar
- Polling interval (5s) — aumentar para reduzir queries

