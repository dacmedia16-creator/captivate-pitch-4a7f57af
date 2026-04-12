
-- =============================================
-- 1. ENUM
-- =============================================
CREATE TYPE public.app_role AS ENUM ('super_admin', 'agency_admin', 'broker');

-- =============================================
-- 2. HELPER FUNCTIONS (before tables so RLS can use them)
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- 3. TABLES
-- =============================================

-- tenants
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- subscription_plans
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  max_users INTEGER NOT NULL DEFAULT 5,
  max_presentations_per_month INTEGER,
  max_storage_mb INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'broker',
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_roles (security-critical, separate from profiles)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- broker_profiles
CREATE TABLE public.broker_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creci TEXT,
  short_bio TEXT,
  years_in_market INTEGER,
  education TEXT,
  specialties TEXT,
  service_regions TEXT,
  vgv_summary TEXT,
  preferred_tone TEXT,
  preferred_layout TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- agency_profiles
CREATE TABLE public.agency_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_name TEXT,
  logo_url TEXT,
  branch_photo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  about_global TEXT,
  about_national TEXT,
  about_regional TEXT,
  regional_numbers TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- marketing_actions
CREATE TABLE public.marketing_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- competitive_differentials
CREATE TABLE public.competitive_differentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sales_results
CREATE TABLE public.sales_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  metric_value TEXT,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- testimonials
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_role TEXT,
  content TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- portal_sources
CREATE TABLE public.portal_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_global BOOLEAN NOT NULL DEFAULT false
);

-- tenant_portal_settings
CREATE TABLE public.tenant_portal_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  portal_source_id UUID NOT NULL REFERENCES public.portal_sources(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  weight NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- presentations
CREATE TABLE public.presentations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  broker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT,
  owner_name TEXT,
  property_type TEXT,
  property_purpose TEXT,
  address TEXT,
  city TEXT,
  neighborhood TEXT,
  condominium TEXT,
  cep TEXT,
  area_total NUMERIC,
  area_built NUMERIC,
  area_land NUMERIC,
  bedrooms INTEGER,
  suites INTEGER,
  bathrooms INTEGER,
  parking_spots INTEGER,
  property_standard TEXT,
  property_age TEXT,
  highlights TEXT,
  owner_expected_price NUMERIC,
  notes TEXT,
  selected_layout TEXT,
  selected_tone TEXT,
  creation_mode TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  share_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- presentation_images
CREATE TABLE public.presentation_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- presentation_sections
CREATE TABLE public.presentation_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  title TEXT,
  content JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- presentation_templates
CREATE TABLE public.presentation_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  broker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  layout TEXT,
  structure JSONB,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- market_analysis_jobs
CREATE TABLE public.market_analysis_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  selected_portals JSONB,
  filters JSONB,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- market_comparables
CREATE TABLE public.market_comparables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_analysis_job_id UUID NOT NULL REFERENCES public.market_analysis_jobs(id) ON DELETE CASCADE,
  source_name TEXT,
  external_id TEXT,
  title TEXT,
  address TEXT,
  neighborhood TEXT,
  condominium TEXT,
  price NUMERIC,
  price_per_sqm NUMERIC,
  area NUMERIC,
  bedrooms INTEGER,
  suites INTEGER,
  parking_spots INTEGER,
  similarity_score NUMERIC,
  source_url TEXT,
  image_url TEXT,
  raw_data JSONB,
  is_approved BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- market_reports
CREATE TABLE public.market_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_analysis_job_id UUID NOT NULL REFERENCES public.market_analysis_jobs(id) ON DELETE CASCADE,
  summary TEXT,
  avg_price NUMERIC,
  median_price NUMERIC,
  avg_price_per_sqm NUMERIC,
  suggested_fast_sale_price NUMERIC,
  suggested_market_price NUMERIC,
  suggested_aspirational_price NUMERIC,
  confidence_level TEXT,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- export_history
CREATE TABLE public.export_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL,
  file_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- audit_logs
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 4. TRIGGERS for updated_at
-- =============================================
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_broker_profiles_updated_at BEFORE UPDATE ON public.broker_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agency_profiles_updated_at BEFORE UPDATE ON public.agency_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_marketing_actions_updated_at BEFORE UPDATE ON public.marketing_actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_presentations_updated_at BEFORE UPDATE ON public.presentations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_presentation_sections_updated_at BEFORE UPDATE ON public.presentation_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 5. SECURITY DEFINER FUNCTIONS (for RLS)
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles
  WHERE id = _user_id LIMIT 1
$$;

-- =============================================
-- 6. TRIGGER: auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, status)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'active');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 7. ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitive_differentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_portal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_comparables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. RLS POLICIES
-- =============================================

-- === tenants ===
CREATE POLICY "super_admin_all_tenants" ON public.tenants FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "user_own_tenant_select" ON public.tenants FOR SELECT USING (id = public.get_user_tenant_id(auth.uid()));

-- === subscription_plans ===
CREATE POLICY "super_admin_all_plans" ON public.subscription_plans FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "authenticated_read_plans" ON public.subscription_plans FOR SELECT TO authenticated USING (true);

-- === profiles ===
CREATE POLICY "super_admin_all_profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "user_own_profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "user_update_own_profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "agency_admin_tenant_profiles" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'agency_admin') AND tenant_id = public.get_user_tenant_id(auth.uid())
);
CREATE POLICY "agency_admin_manage_tenant_profiles" ON public.profiles FOR UPDATE USING (
  public.has_role(auth.uid(), 'agency_admin') AND tenant_id = public.get_user_tenant_id(auth.uid())
);

-- === user_roles ===
CREATE POLICY "super_admin_all_roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "user_read_own_role" ON public.user_roles FOR SELECT USING (user_id = auth.uid());

-- === broker_profiles ===
CREATE POLICY "super_admin_all_broker_profiles" ON public.broker_profiles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "broker_own_profile" ON public.broker_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY "agency_admin_tenant_broker_profiles" ON public.broker_profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'agency_admin') AND user_id IN (
    SELECT id FROM public.profiles WHERE tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- === agency_profiles ===
CREATE POLICY "super_admin_all_agency_profiles" ON public.agency_profiles FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "agency_admin_own_agency" ON public.agency_profiles FOR ALL USING (
  public.has_role(auth.uid(), 'agency_admin') AND tenant_id = public.get_user_tenant_id(auth.uid())
);
CREATE POLICY "broker_read_own_agency" ON public.agency_profiles FOR SELECT USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
);

-- === marketing_actions ===
CREATE POLICY "super_admin_all_marketing" ON public.marketing_actions FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "agency_admin_own_marketing" ON public.marketing_actions FOR ALL USING (
  public.has_role(auth.uid(), 'agency_admin') AND tenant_id = public.get_user_tenant_id(auth.uid())
);
CREATE POLICY "broker_read_own_tenant_marketing" ON public.marketing_actions FOR SELECT USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
);

-- === competitive_differentials ===
CREATE POLICY "super_admin_all_differentials" ON public.competitive_differentials FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "agency_admin_own_differentials" ON public.competitive_differentials FOR ALL USING (
  public.has_role(auth.uid(), 'agency_admin') AND tenant_id = public.get_user_tenant_id(auth.uid())
);
CREATE POLICY "broker_read_own_tenant_differentials" ON public.competitive_differentials FOR SELECT USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
);

-- === sales_results ===
CREATE POLICY "super_admin_all_sales" ON public.sales_results FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "agency_admin_own_sales" ON public.sales_results FOR ALL USING (
  public.has_role(auth.uid(), 'agency_admin') AND tenant_id = public.get_user_tenant_id(auth.uid())
);
CREATE POLICY "broker_read_own_tenant_sales" ON public.sales_results FOR SELECT USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
);

-- === testimonials ===
CREATE POLICY "super_admin_all_testimonials" ON public.testimonials FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "agency_admin_own_testimonials" ON public.testimonials FOR ALL USING (
  public.has_role(auth.uid(), 'agency_admin') AND tenant_id = public.get_user_tenant_id(auth.uid())
);
CREATE POLICY "broker_read_own_tenant_testimonials" ON public.testimonials FOR SELECT USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
);

-- === portal_sources ===
CREATE POLICY "authenticated_read_portals" ON public.portal_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "super_admin_manage_portals" ON public.portal_sources FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

-- === tenant_portal_settings ===
CREATE POLICY "super_admin_all_portal_settings" ON public.tenant_portal_settings FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "agency_admin_own_portal_settings" ON public.tenant_portal_settings FOR ALL USING (
  public.has_role(auth.uid(), 'agency_admin') AND tenant_id = public.get_user_tenant_id(auth.uid())
);
CREATE POLICY "broker_read_own_tenant_portal_settings" ON public.tenant_portal_settings FOR SELECT USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
);

-- === presentations ===
CREATE POLICY "super_admin_all_presentations" ON public.presentations FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "agency_admin_tenant_presentations" ON public.presentations FOR ALL USING (
  public.has_role(auth.uid(), 'agency_admin') AND tenant_id = public.get_user_tenant_id(auth.uid())
);
CREATE POLICY "broker_own_presentations" ON public.presentations FOR ALL USING (broker_id = auth.uid());

-- === presentation_images ===
CREATE POLICY "super_admin_all_pres_images" ON public.presentation_images FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "user_pres_images" ON public.presentation_images FOR ALL USING (
  presentation_id IN (SELECT id FROM public.presentations WHERE broker_id = auth.uid())
);
CREATE POLICY "agency_admin_pres_images" ON public.presentation_images FOR ALL USING (
  public.has_role(auth.uid(), 'agency_admin') AND presentation_id IN (
    SELECT id FROM public.presentations WHERE tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- === presentation_sections ===
CREATE POLICY "super_admin_all_pres_sections" ON public.presentation_sections FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "user_pres_sections" ON public.presentation_sections FOR ALL USING (
  presentation_id IN (SELECT id FROM public.presentations WHERE broker_id = auth.uid())
);
CREATE POLICY "agency_admin_pres_sections" ON public.presentation_sections FOR ALL USING (
  public.has_role(auth.uid(), 'agency_admin') AND presentation_id IN (
    SELECT id FROM public.presentations WHERE tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- === presentation_templates ===
CREATE POLICY "super_admin_all_templates" ON public.presentation_templates FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "agency_admin_tenant_templates" ON public.presentation_templates FOR ALL USING (
  public.has_role(auth.uid(), 'agency_admin') AND tenant_id = public.get_user_tenant_id(auth.uid())
);
CREATE POLICY "broker_read_tenant_templates" ON public.presentation_templates FOR SELECT USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
);

-- === market_analysis_jobs ===
CREATE POLICY "super_admin_all_jobs" ON public.market_analysis_jobs FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "agency_admin_tenant_jobs" ON public.market_analysis_jobs FOR ALL USING (
  public.has_role(auth.uid(), 'agency_admin') AND tenant_id = public.get_user_tenant_id(auth.uid())
);
CREATE POLICY "broker_own_jobs" ON public.market_analysis_jobs FOR ALL USING (
  presentation_id IN (SELECT id FROM public.presentations WHERE broker_id = auth.uid())
);

-- === market_comparables ===
CREATE POLICY "super_admin_all_comparables" ON public.market_comparables FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "user_own_comparables" ON public.market_comparables FOR ALL USING (
  market_analysis_job_id IN (
    SELECT maj.id FROM public.market_analysis_jobs maj
    JOIN public.presentations p ON p.id = maj.presentation_id
    WHERE p.broker_id = auth.uid()
  )
);
CREATE POLICY "agency_admin_comparables" ON public.market_comparables FOR ALL USING (
  public.has_role(auth.uid(), 'agency_admin') AND market_analysis_job_id IN (
    SELECT id FROM public.market_analysis_jobs WHERE tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- === market_reports ===
CREATE POLICY "super_admin_all_reports" ON public.market_reports FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "user_own_reports" ON public.market_reports FOR ALL USING (
  market_analysis_job_id IN (
    SELECT maj.id FROM public.market_analysis_jobs maj
    JOIN public.presentations p ON p.id = maj.presentation_id
    WHERE p.broker_id = auth.uid()
  )
);
CREATE POLICY "agency_admin_reports" ON public.market_reports FOR ALL USING (
  public.has_role(auth.uid(), 'agency_admin') AND market_analysis_job_id IN (
    SELECT id FROM public.market_analysis_jobs WHERE tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- === export_history ===
CREATE POLICY "super_admin_all_exports" ON public.export_history FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "user_own_exports" ON public.export_history FOR ALL USING (created_by = auth.uid());
CREATE POLICY "agency_admin_exports" ON public.export_history FOR ALL USING (
  public.has_role(auth.uid(), 'agency_admin') AND presentation_id IN (
    SELECT id FROM public.presentations WHERE tenant_id = public.get_user_tenant_id(auth.uid())
  )
);

-- === audit_logs ===
CREATE POLICY "super_admin_all_audit" ON public.audit_logs FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "agency_admin_tenant_audit" ON public.audit_logs FOR SELECT USING (
  public.has_role(auth.uid(), 'agency_admin') AND tenant_id = public.get_user_tenant_id(auth.uid())
);

-- =============================================
-- 9. SEED DATA
-- =============================================

-- Portal sources
INSERT INTO public.portal_sources (code, name, is_global) VALUES
  ('vivareal', 'Viva Real', true),
  ('zap', 'ZAP Imóveis', true),
  ('olx', 'OLX', true),
  ('imovelweb', 'Imóvel Web', true),
  ('chavesnamao', 'Chaves na Mão', false),
  ('portal_proprio', 'Portal Próprio', false),
  ('portal_regional', 'Portal Regional', false),
  ('base_interna', 'Base Interna', false);

-- Default subscription plan
INSERT INTO public.subscription_plans (name, max_users, max_presentations_per_month, max_storage_mb) VALUES
  ('Profissional', 10, 50, 5120);
