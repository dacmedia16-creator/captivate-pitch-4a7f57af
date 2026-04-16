CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'expire-stuck-market-studies',
  '*/5 * * * *',
  $$SELECT public.expire_stuck_studies()$$
);