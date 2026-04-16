CREATE OR REPLACE FUNCTION public.expire_stuck_studies()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _count integer;
BEGIN
  UPDATE market_studies
  SET status = 'failed', current_phase = NULL, updated_at = now()
  WHERE status = 'processing'
    AND updated_at < now() - interval '15 minutes';
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;