

# Fix: Manus API v2 Integration — Wrong Endpoints and Response Parsing

## Root Cause
The edge function uses **incorrect API endpoints and response structures**:

1. `task.get` does not exist in Manus API v2 → correct endpoint is `task.detail`
2. Response is `{ ok, task: { status } }` but code reads `data.status` directly
3. Status values are `running | stopped | waiting | error` — code checks for `completed`, `done`, `failed` which don't exist in the API
4. `task.listMessages` response has typed message objects (`user_message.content`, `assistant_message.content` as nested objects), not flat `role`/`content` fields
5. 55s polling timeout is too short — Manus browser tasks often take 3-10 minutes

## Solution

### Fix `supabase/functions/analyze-market-manus/index.ts`

**1. Fix `getTaskStatus`** — change `task.get` to `task.detail`, extract `data.task`
```typescript
async function getTaskStatus(taskId: string, apiKey: string): Promise<any> {
  const res = await fetch(`${MANUS_API}/task.detail?task_id=${taskId}`, {
    headers: { "x-manus-api-key": apiKey },
  });
  if (res.ok) {
    const data = await res.json();
    return data.task || null;  // task object is nested under "task" key
  }
  await res.text();
  return null;
}
```

**2. Fix status checks in `pollManusTask`** — use correct enum values
```text
- "completed"/"done" → "stopped" (only valid terminal success status)
- "failed" → "error"  
- Keep "running" and "waiting" as continue-polling states
```

**3. Fix message extraction** — use v2 message structure
```typescript
// v2 messages have type-specific nested objects:
// { type: "assistant_message", assistant_message: { content: "..." } }
for (const m of messages) {
  if (m.type === "assistant_message" && m.assistant_message?.content) {
    return m.assistant_message.content;
  }
}
```

**4. Increase tolerance for timeout** — since Manus tasks are long-running, keep 55s but make the timeout a graceful fallback (not an error), returning `{ success: false }` so the cascade continues to Firecrawl.

**5. Add initial delay** — Manus needs a few seconds to initialize the task before `task.detail` will return valid data. Add a 3-second initial wait before first poll.

## Files Changed
- `supabase/functions/analyze-market-manus/index.ts` — fix endpoints, response parsing, status values, message extraction

## Result
- `task.detail` returns valid status instead of 404
- Correct status checks (`stopped` = done, `error` = failed)
- Proper message content extraction from v2 response format
- Graceful timeout that allows Firecrawl fallback to work

