
ALTER TABLE public.market_study_comparables
  ADD COLUMN IF NOT EXISTS condominium_fee numeric,
  ADD COLUMN IF NOT EXISTS iptu numeric,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS added_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_complete boolean
    GENERATED ALWAYS AS (price IS NOT NULL AND area IS NOT NULL AND area > 0) STORED;
