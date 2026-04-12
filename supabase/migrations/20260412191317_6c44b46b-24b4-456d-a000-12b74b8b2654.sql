
-- 1. market_studies
CREATE TABLE public.market_studies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  purpose TEXT DEFAULT 'venda',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker_own_studies" ON public.market_studies FOR ALL USING (broker_id = auth.uid());
CREATE POLICY "agency_admin_tenant_studies" ON public.market_studies FOR ALL USING (has_role(auth.uid(), 'agency_admin') AND tenant_id = get_user_tenant_id(auth.uid()));
CREATE POLICY "super_admin_all_studies" ON public.market_studies FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_market_studies_updated_at BEFORE UPDATE ON public.market_studies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. market_study_subject_properties
CREATE TABLE public.market_study_subject_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_study_id UUID NOT NULL REFERENCES public.market_studies(id) ON DELETE CASCADE,
  purpose TEXT DEFAULT 'venda',
  property_type TEXT,
  property_category TEXT,
  address TEXT,
  neighborhood TEXT,
  condominium TEXT,
  city TEXT,
  state TEXT,
  cep TEXT,
  area_land NUMERIC,
  area_built NUMERIC,
  area_useful NUMERIC,
  bedrooms INTEGER,
  suites INTEGER,
  bathrooms INTEGER,
  parking_spots INTEGER,
  living_rooms INTEGER,
  powder_rooms INTEGER,
  property_age TEXT,
  construction_standard TEXT,
  conservation_state TEXT,
  differentials JSONB DEFAULT '[]'::jsonb,
  condominium_fee NUMERIC,
  iptu NUMERIC,
  observations TEXT,
  pricing_objective TEXT,
  owner_expected_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_study_subject_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker_own_subject_props" ON public.market_study_subject_properties FOR ALL USING (
  market_study_id IN (SELECT id FROM public.market_studies WHERE broker_id = auth.uid())
);
CREATE POLICY "agency_admin_subject_props" ON public.market_study_subject_properties FOR ALL USING (
  has_role(auth.uid(), 'agency_admin') AND market_study_id IN (SELECT id FROM public.market_studies WHERE tenant_id = get_user_tenant_id(auth.uid()))
);
CREATE POLICY "super_admin_subject_props" ON public.market_study_subject_properties FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_subject_props_updated_at BEFORE UPDATE ON public.market_study_subject_properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. market_study_comparables
CREATE TABLE public.market_study_comparables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_study_id UUID NOT NULL REFERENCES public.market_studies(id) ON DELETE CASCADE,
  title TEXT,
  address TEXT,
  neighborhood TEXT,
  condominium TEXT,
  city TEXT,
  property_type TEXT,
  price NUMERIC,
  price_per_sqm NUMERIC,
  area NUMERIC,
  bedrooms INTEGER,
  suites INTEGER,
  bathrooms INTEGER,
  parking_spots INTEGER,
  construction_standard TEXT,
  conservation_state TEXT,
  differentials JSONB DEFAULT '[]'::jsonb,
  similarity_score NUMERIC DEFAULT 0,
  listing_status TEXT DEFAULT 'active',
  source_name TEXT,
  source_url TEXT,
  image_url TEXT,
  external_id TEXT,
  raw_data JSONB,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  adjusted_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_study_comparables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker_own_study_comparables" ON public.market_study_comparables FOR ALL USING (
  market_study_id IN (SELECT id FROM public.market_studies WHERE broker_id = auth.uid())
);
CREATE POLICY "agency_admin_study_comparables" ON public.market_study_comparables FOR ALL USING (
  has_role(auth.uid(), 'agency_admin') AND market_study_id IN (SELECT id FROM public.market_studies WHERE tenant_id = get_user_tenant_id(auth.uid()))
);
CREATE POLICY "super_admin_study_comparables" ON public.market_study_comparables FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- 4. market_study_adjustments
CREATE TABLE public.market_study_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comparable_id UUID NOT NULL REFERENCES public.market_study_comparables(id) ON DELETE CASCADE,
  adjustment_type TEXT NOT NULL,
  label TEXT NOT NULL,
  percentage NUMERIC DEFAULT 0,
  value NUMERIC DEFAULT 0,
  direction TEXT NOT NULL DEFAULT 'neutral',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_study_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker_own_adjustments" ON public.market_study_adjustments FOR ALL USING (
  comparable_id IN (
    SELECT c.id FROM public.market_study_comparables c
    JOIN public.market_studies s ON s.id = c.market_study_id
    WHERE s.broker_id = auth.uid()
  )
);
CREATE POLICY "agency_admin_adjustments" ON public.market_study_adjustments FOR ALL USING (
  has_role(auth.uid(), 'agency_admin') AND comparable_id IN (
    SELECT c.id FROM public.market_study_comparables c
    JOIN public.market_studies s ON s.id = c.market_study_id
    WHERE s.tenant_id = get_user_tenant_id(auth.uid())
  )
);
CREATE POLICY "super_admin_adjustments" ON public.market_study_adjustments FOR ALL USING (has_role(auth.uid(), 'super_admin'));

-- 5. market_study_results
CREATE TABLE public.market_study_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_study_id UUID NOT NULL REFERENCES public.market_studies(id) ON DELETE CASCADE,
  avg_price NUMERIC,
  median_price NUMERIC,
  avg_price_per_sqm NUMERIC,
  suggested_ad_price NUMERIC,
  suggested_market_price NUMERIC,
  suggested_fast_sale_price NUMERIC,
  price_range_min NUMERIC,
  price_range_max NUMERIC,
  executive_summary TEXT,
  justification TEXT,
  market_insights JSONB DEFAULT '[]'::jsonb,
  confidence_level TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_study_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broker_own_results" ON public.market_study_results FOR ALL USING (
  market_study_id IN (SELECT id FROM public.market_studies WHERE broker_id = auth.uid())
);
CREATE POLICY "agency_admin_results" ON public.market_study_results FOR ALL USING (
  has_role(auth.uid(), 'agency_admin') AND market_study_id IN (SELECT id FROM public.market_studies WHERE tenant_id = get_user_tenant_id(auth.uid()))
);
CREATE POLICY "super_admin_results" ON public.market_study_results FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON public.market_study_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. market_study_settings
CREATE TABLE public.market_study_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
  similarity_weights JSONB DEFAULT '{"same_condominium":25,"same_neighborhood":20,"same_type":15,"area_range":15,"rooms_proximity":10,"same_standard":10,"same_profile":5}'::jsonb,
  adjustment_weights JSONB DEFAULT '{"pool":4,"gourmet_area":2.5,"master_suite":2,"extra_parking":1.5,"larger_land":3,"better_conservation":5,"newer_building":3,"privileged_view":4,"premium_location":3}'::jsonb,
  default_filters JSONB DEFAULT '{"radius_km":5,"area_range_pct":20,"max_comparables":15,"min_similarity":30}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_study_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_admin_own_settings" ON public.market_study_settings FOR ALL USING (
  has_role(auth.uid(), 'agency_admin') AND tenant_id = get_user_tenant_id(auth.uid())
);
CREATE POLICY "broker_read_settings" ON public.market_study_settings FOR SELECT USING (
  tenant_id = get_user_tenant_id(auth.uid())
);
CREATE POLICY "super_admin_all_settings" ON public.market_study_settings FOR ALL USING (has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.market_study_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
