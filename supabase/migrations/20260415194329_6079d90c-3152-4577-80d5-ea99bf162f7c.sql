UPDATE public.portal_sources SET is_global = false WHERE code = 'kenlo';
DELETE FROM public.tenant_portal_settings WHERE portal_source_id = (SELECT id FROM public.portal_sources WHERE code = 'kenlo');