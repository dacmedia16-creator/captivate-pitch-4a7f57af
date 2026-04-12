ALTER TABLE agency_profiles ADD COLUMN IF NOT EXISTS about_global_stats jsonb DEFAULT NULL;
ALTER TABLE agency_profiles ADD COLUMN IF NOT EXISTS about_national_stats jsonb DEFAULT NULL;
ALTER TABLE agency_profiles ADD COLUMN IF NOT EXISTS about_regional_stats jsonb DEFAULT NULL;