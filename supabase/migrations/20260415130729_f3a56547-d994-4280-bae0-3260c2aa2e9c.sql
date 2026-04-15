
-- 1. Tabela tenant_usage para tracking de uso mensal
CREATE TABLE public.tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- formato: '2026-04'
  market_studies_count INTEGER NOT NULL DEFAULT 0,
  presentations_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, month)
);

ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;

-- Brokers can read their tenant's usage
CREATE POLICY "broker_read_tenant_usage" ON public.tenant_usage
  FOR SELECT USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Agency admins can manage their tenant's usage
CREATE POLICY "agency_admin_tenant_usage" ON public.tenant_usage
  FOR ALL USING (
    has_role(auth.uid(), 'agency_admin'::app_role)
    AND tenant_id = get_user_tenant_id(auth.uid())
  );

-- Super admins can manage all
CREATE POLICY "super_admin_all_usage" ON public.tenant_usage
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_tenant_usage_updated_at
  BEFORE UPDATE ON public.tenant_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add plan_id to tenants
ALTER TABLE public.tenants ADD COLUMN plan_id UUID REFERENCES public.subscription_plans(id);

-- 3. Function to increment usage (called from edge functions via service_role)
CREATE OR REPLACE FUNCTION public.increment_tenant_usage(
  _tenant_id UUID,
  _field TEXT -- 'market_studies_count' or 'presentations_count'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _month TEXT := to_char(now(), 'YYYY-MM');
BEGIN
  INSERT INTO public.tenant_usage (tenant_id, month)
  VALUES (_tenant_id, _month)
  ON CONFLICT (tenant_id, month) DO NOTHING;

  IF _field = 'market_studies_count' THEN
    UPDATE public.tenant_usage
    SET market_studies_count = market_studies_count + 1
    WHERE tenant_id = _tenant_id AND month = _month;
  ELSIF _field = 'presentations_count' THEN
    UPDATE public.tenant_usage
    SET presentations_count = presentations_count + 1
    WHERE tenant_id = _tenant_id AND month = _month;
  END IF;
END;
$$;

-- 4. Function to check if tenant is within plan limits
CREATE OR REPLACE FUNCTION public.check_tenant_limit(
  _tenant_id UUID,
  _field TEXT -- 'market_studies' or 'presentations'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _month TEXT := to_char(now(), 'YYYY-MM');
  _current_count INTEGER := 0;
  _max_limit INTEGER;
  _plan_id UUID;
BEGIN
  -- Get tenant's plan
  SELECT plan_id INTO _plan_id FROM public.tenants WHERE id = _tenant_id;
  IF _plan_id IS NULL THEN RETURN TRUE; END IF; -- No plan = unlimited

  -- Get limit from plan
  IF _field = 'market_studies' THEN
    SELECT max_presentations_per_month INTO _max_limit FROM public.subscription_plans WHERE id = _plan_id;
  ELSIF _field = 'presentations' THEN
    SELECT max_presentations_per_month INTO _max_limit FROM public.subscription_plans WHERE id = _plan_id;
  END IF;

  IF _max_limit IS NULL THEN RETURN TRUE; END IF; -- NULL = unlimited

  -- Get current usage
  SELECT COALESCE(
    CASE WHEN _field = 'market_studies' THEN market_studies_count
         WHEN _field = 'presentations' THEN presentations_count
         ELSE 0 END, 0
  ) INTO _current_count
  FROM public.tenant_usage
  WHERE tenant_id = _tenant_id AND month = _month;

  RETURN _current_count < _max_limit;
END;
$$;
