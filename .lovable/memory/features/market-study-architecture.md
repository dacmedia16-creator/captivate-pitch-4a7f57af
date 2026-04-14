---
name: Market Study Architecture (Final)
description: Consolidated architecture — market_studies is the sole official flow, edge function saves data directly
type: feature
---

## Official Flow (market_studies)

All new presentations use this flow:
- `market_studies` → study container (broker_id, tenant_id, status)
- `market_study_subject_properties` → the property being evaluated
- `market_study_comparables` → comparables (origin: manual|auto_firecrawl|auto_manus, raw_listing_id links to raw_listings)
- `market_study_results` → pricing output (avg, median, suggested prices)
- `market_study_executions` → audit trail per portal search
- `market_study_raw_listings` → raw scraped data per execution
- `market_study_adjustments` → per-comparable price adjustments
- `market_study_settings` → tenant-level weights and filters

`presentations.market_study_id` links a presentation to its study.

## Data Flow (Critical)

The `analyze-market-deep` edge function handles the ENTIRE pipeline:
1. Scrapes portals (Firecrawl + Google)
2. Extracts comparables via AI
3. Scores similarity
4. **Inserts comparables directly into `market_study_comparables`** (using service_role)
5. **Calculates and inserts adjustments** into `market_study_adjustments`
6. **Calculates and inserts results** into `market_study_results`
7. Updates `market_studies.status` to "completed" or "failed"
8. Tries AI summary (non-fatal)

The frontend (`AgentNewPresentation.tsx`):
- Creates study + subject property
- Calls edge function cascade (Manus → Deep → Basic)
- If 202 (background): polls `market_studies.status` every 5s
- When completed: reads results from DB and updates presentation sections

**No scoring/insertion logic in frontend.** All DB writes are in the edge function.

## Legacy Tables (READ-ONLY — do not delete)

These tables remain in the database for historical data from pre-migration presentations:
- `market_analysis_jobs` — old job container (linked via presentation_id)
- `market_comparables` — old comparables (linked via market_analysis_job_id)
- `market_reports` — old pricing reports (linked via market_analysis_job_id)

**No code writes to these tables.** Read-only fallback exists in:
- `useGeneratePresentation.ts` → fetchMarketData() else branch
- `generate-presentation-text/index.ts` → else branch after market_study_id check

Both marked with `// LEGACY COMPAT (read-only)`.

## Deleted Files

- `src/hooks/useSimulateComparables.ts` — removed (dead code, referenced legacy schema)
- Legacy pages `AgentMarketStudy.tsx`, `MarketStudyDetail.tsx` — removed

Legacy routes `/market-study` and `/market-study/:id` redirect to `/market-studies`.

## Official Routes

- `/market-studies` → MarketStudies.tsx (list)
- `/market-studies/:id` → MarketStudyResult.tsx (detail)
