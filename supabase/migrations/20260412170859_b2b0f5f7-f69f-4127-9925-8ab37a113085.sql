ALTER TABLE public.portal_sources ADD COLUMN IF NOT EXISTS base_url TEXT;

INSERT INTO public.portal_sources (code, name, is_global, base_url) VALUES
  ('kenlo', 'Kenlo', true, 'https://portal.kenlo.com.br/')
ON CONFLICT (code) DO NOTHING;