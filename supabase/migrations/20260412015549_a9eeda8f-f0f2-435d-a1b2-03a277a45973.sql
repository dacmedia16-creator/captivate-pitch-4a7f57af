
-- Security definer function to get presentation by share token
CREATE OR REPLACE FUNCTION public.get_presentation_by_share_token(_token text)
RETURNS SETOF presentations
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.presentations
  WHERE share_token = _token
  LIMIT 1
$$;

-- Anon SELECT on presentations via share_token
CREATE POLICY "anon_read_shared_presentations"
ON public.presentations
FOR SELECT
TO anon
USING (share_token IS NOT NULL AND share_token != '');

-- Anon SELECT on presentation_sections via shared presentation
CREATE POLICY "anon_read_shared_sections"
ON public.presentation_sections
FOR SELECT
TO anon
USING (
  presentation_id IN (
    SELECT id FROM public.presentations WHERE share_token IS NOT NULL AND share_token != ''
  )
);

-- Anon SELECT on agency_profiles for shared presentation branding
CREATE POLICY "anon_read_shared_agency_branding"
ON public.agency_profiles
FOR SELECT
TO anon
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.presentations WHERE share_token IS NOT NULL AND share_token != ''
  )
);

-- Allow authenticated users to INSERT audit logs
CREATE POLICY "authenticated_insert_audit_logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
