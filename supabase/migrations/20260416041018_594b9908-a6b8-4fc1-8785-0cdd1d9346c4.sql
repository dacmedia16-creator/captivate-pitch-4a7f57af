ALTER TABLE public.broker_profiles
  ADD COLUMN portfolio_images jsonb DEFAULT '[]',
  ADD COLUMN personal_results jsonb DEFAULT '[]',
  ADD COLUMN personal_testimonials jsonb DEFAULT '[]';