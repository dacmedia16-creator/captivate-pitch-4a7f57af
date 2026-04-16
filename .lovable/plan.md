

# Fix: Broker Profile Save Error

## Problem
The error "there is no unique or exclusion constraint matching the ON CONFLICT specification" occurs because `broker_profiles.user_id` has a foreign key but **no unique constraint**. The `upsert` in `AgentProfile.tsx` uses `onConflict: "user_id"`, which requires a unique constraint.

## Solution

### 1. Database migration
Add a unique constraint on `broker_profiles.user_id`:
```sql
ALTER TABLE broker_profiles ADD CONSTRAINT broker_profiles_user_id_key UNIQUE (user_id);
```

### 2. No code changes needed
The existing `upsert(..., { onConflict: "user_id" })` in `AgentProfile.tsx` will work correctly once the constraint exists.

## Files
| File | Change |
|------|--------|
| DB (migration) | Add unique constraint on `broker_profiles.user_id` |

