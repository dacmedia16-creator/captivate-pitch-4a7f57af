

# Fix: Inngest SDK v4 Compatibility

## Problem
The `inngest-serve` edge function crashes on boot because:
1. `esm.sh/inngest` resolves to **v4.2.2** but code uses the **v3 API** (3-argument `createFunction`)
2. Import `inngest/edge` doesn't exist in v4 — should be `inngest/deno`

Error: `"createFunction" expected a handler function as the second argument. Triggers belong in the first argument`

## Fix (single file: `supabase/functions/inngest-serve/index.ts`)

### 1. Fix imports (lines 1-2)
```typescript
// FROM:
import { Inngest } from "https://esm.sh/inngest";
import { serve } from "https://esm.sh/inngest/edge";

// TO:
import { Inngest } from "https://esm.sh/inngest@4.2.2";
import { serve } from "https://esm.sh/inngest@4.2.2/deno";
```

### 2. Fix `createFunction` signature (lines 669-683)
```typescript
// FROM (v3 — 3 args):
const marketStudyAnalyze = inngest.createFunction(
  { id: "market-study-analyze", retries: 2 },
  { event: "market-study/analyze.requested" },
  async ({ event }) => { ... }
);

// TO (v4 — 2 args, trigger in first arg):
const marketStudyAnalyze = inngest.createFunction(
  { id: "market-study-analyze", retries: 2, trigger: { event: "market-study/analyze.requested" } },
  async ({ event }) => { ... }
);
```

### 3. Deploy & re-sync
- Deploy `inngest-serve`
- Re-attempt sync from Inngest dashboard with same URL

No other files change. Frontend, Phases 1-3, and `analyze-market-deep` remain untouched.

