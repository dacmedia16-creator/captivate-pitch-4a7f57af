
-- 1. market_study_executions
CREATE TABLE public.market_study_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_study_id uuid NOT NULL REFERENCES public.market_studies(id) ON DELETE CASCADE,
  portal_source_id uuid REFERENCES public.portal_sources(id),
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz,
  finished_at timestamptz,
  listings_found integer DEFAULT 0,
  listings_matched integer DEFAULT 0,
  error_message text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.market_study_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker_own_executions" ON public.market_study_executions FOR ALL
  USING (market_study_id IN (SELECT id FROM public.market_studies WHERE broker_id = auth.uid()));

CREATE POLICY "agency_admin_executions" ON public.market_study_executions FOR ALL
  USING (has_role(auth.uid(), 'agency_admin') AND market_study_id IN (
    SELECT id FROM public.market_studies WHERE tenant_id = get_user_tenant_id(auth.uid())
  ));

CREATE POLICY "super_admin_executions" ON public.market_study_executions FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- 2. market_study_raw_listings
CREATE TABLE public.market_study_raw_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_study_id uuid NOT NULL REFERENCES public.market_studies(id) ON DELETE CASCADE,
  execution_id uuid REFERENCES public.market_study_executions(id) ON DELETE SET NULL,
  portal_source_id uuid REFERENCES public.portal_sources(id),
  external_url text,
  external_id text,
  raw_data jsonb,
  title text,
  price numeric,
  area numeric,
  bedrooms integer,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.market_study_raw_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker_own_raw_listings" ON public.market_study_raw_listings FOR ALL
  USING (market_study_id IN (SELECT id FROM public.market_studies WHERE broker_id = auth.uid()));

CREATE POLICY "agency_admin_raw_listings" ON public.market_study_raw_listings FOR ALL
  USING (has_role(auth.uid(), 'agency_admin') AND market_study_id IN (
    SELECT id FROM public.market_studies WHERE tenant_id = get_user_tenant_id(auth.uid())
  ));

CREATE POLICY "super_admin_raw_listings" ON public.market_study_raw_listings FOR ALL
  USING (has_role(auth.uid(), 'super_admin'));

-- 3. Add origin + raw_listing_id to market_study_comparables
ALTER TABLE public.market_study_comparables
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS raw_listing_id uuid REFERENCES public.market_study_raw_listings(id) ON DELETE SET NULL;

-- 4. Add market_study_id to presentations
ALTER TABLE public.presentations
  ADD COLUMN IF NOT EXISTS market_study_id uuid REFERENCES public.market_studies(id) ON DELETE SET NULL;
